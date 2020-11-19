/** TimeBlock
 *  - an abstract class for timeblocks of loaded funds
 */
abstract class TimeBlock {

    end?: Date;
    start?: Date;
    total = 0;

    constructor(config?: {
        end?: Date,
        start?: Date,
        time?: Date,
        total?: number
    }) {
        if (config) {
            if (config.end) {
                this.end = new Date(config.end);
            }
            if (config.start) {
                this.start = new Date(config.start);
            }
            if (config.time) {
                this.setTimeRange(new Date(config.time));
            }
            if (config.total) {
                this.total = config.total;
            }
        }
    }

    abstract add(loadAttempt: LoadAttempt): void;
    abstract hasInTimeRange(date: Date): boolean;
    protected abstract setTimeRange(date: Date): void;
}

/** CustomerHistory
 *  - Represents the load attempt history for a single user
 */
export class CustomerHistory {

    // A map to keep track of past laod attempts. Used to search for duplicate ids, and fast mapping with results
    loadAttempts: Map<string, LoadAttempt> = new Map<string, LoadAttempt>();

    // Keeps track of the current week's load attempt for verification purposes
    week: Week | undefined;

    constructor(config?: {
        loadAttempts?: Map<string, LoadAttempt>,
        week?: Week
    }) {
        if (config) {
            if (config.week) {
                this.week = new Week(config.week);
            }
            if (config.loadAttempts) {
                this.loadAttempts = new Map(config.loadAttempts);
            }
        }
    }

    add(loadAttempt: LoadAttempt): void {

        // Create a new week when weeks is empty or if the previously recorded week is too far in the past.
        if (
            !this.week
            || !(
                this.week.start
                && this.week.end
                && this.week.start <= loadAttempt.time
                && loadAttempt.time <= this.week.end
            )
        ) {
            this.week = new Week({time: loadAttempt.time});
        }

        // Update
        this.week.add(loadAttempt);
    }
}

/** Day
 *  - Represents a one day time block (24 hours) of a user's history
 */
export class Day extends TimeBlock {
    loadAttempts: LoadAttempt[] = [];

    constructor(config?: {
        end?: Date,
        loadAttempts?: LoadAttempt[],
        start?: Date,
        time?: Date,
        total?: number
    }) {
        super(config);
        if (config) {
            if (config.loadAttempts) {
                this.loadAttempts.push(...config.loadAttempts.map(loadAttempt => new LoadAttempt(loadAttempt)));
            }
        }
    }

    // Add a load attempt to the day
    add(loadAttempt: LoadAttempt): void {
        this.loadAttempts.push(loadAttempt);
        this.total += loadAttempt.load_amount_value;
    }

    /** isInTimeRange()
     *  - determines whether a given date falls within range of the timeblock
     */
    hasInTimeRange(date: Date): boolean {
        return (this.start && this.end && this.start <= date  && date <= this.end) ? true : false;
    }

    /** setTimeRange()
     *  - Sets the datetime range for the day
     */
    setTimeRange(date: Date): void {

        // get the length of a day in millis
        const dayLength = 24 * 60 * 60 * 1000;

        // Get the datetime for the last millisecond of the previous day
        const endOfLastDay = new Date(date.getTime() - dayLength);
        endOfLastDay.setUTCHours(23, 59, 59, 999);

        // Set start to the the first millisecond of the day
        this.start = new Date(endOfLastDay.getTime() + 1);

        // Set end to the last millisecond of the day
        this.end = new Date(endOfLastDay.getTime() + dayLength);
    }
}

/** LoadAttempt
 *  - Represents a load attempt
 */
export class LoadAttempt {
    id: string;
    customer_id: string;
    load_amount: string;
    load_amount_value: number;
    time: Date;

    constructor(config: LoadAttempt) {
        if (!config.customer_id || !config.id || !config.load_amount) {
            throw new Error('Invalid LoadAttempt Object');
        }
        this.id = config.id;
        this.customer_id = config.customer_id;
        this.load_amount = config.load_amount;
        let load_amount_value = 0;

        // Parse the currency value from load_aount
        if (this.load_amount) {
            try {
                load_amount_value = parseFloat(config.load_amount.replace(/[$, ]/g, ''));
            }
            catch (err) {
                console.error('Error parsing currency value', config.load_amount, err);
            }
        }
        this.load_amount_value = load_amount_value;
        this.time = new Date(config.time);
    }
}

/** LoadAttemptResult
 *  - Represents the accept/deny result of a load attempt
 */
export class LoadAttemptResult {
    accepted: boolean;
    id: string;
    customer_id: string;

    constructor(config: LoadAttemptResult) {
        this.accepted = config.accepted;
        this.id = config.id;
        this.customer_id = config.customer_id;
    }
}

/** State
 *  - Represents the app's state (history, output)
 */
export class State {
    history: Map<string, CustomerHistory> = new Map<string, CustomerHistory>();
    output: LoadAttemptResult[] = [];

    constructor(config?: {
        history: Map<string, CustomerHistory>,
        output: LoadAttemptResult[]
    }) {
        if (config) {
            if (config.history) {
                config.history.forEach((value, key) => {
                    this.history.set(key, new CustomerHistory(value));
                });
            }
            if (config.output) {
                this.output.push(...config.output.map(result => new LoadAttemptResult(result)));
            }
        }
    }

    /** validateLoad()
     *  - validates whether a load attempt will be successful or not
     */
    validateLoad(loadAttempt: LoadAttempt): LoadAttemptResult {
        let accepted = true;

        const history = this.history.get(loadAttempt.customer_id);

        // Deny if load amount is over the daily limit
        if (loadAttempt.load_amount_value > 5000) {
            accepted = false;
        }
        // Validate the cases where the customer history already exists (not the customer's first load attempt ever)
        else if (history) {

            // Deny if the load attempt id is a duplicate
            if (history.loadAttempts.has(loadAttempt.id)) {
                accepted = false;
            }

            // Validate the cases where the week already exists (not the customer's first load attempt of the week)
            else if (history.week?.hasInTimeRange(loadAttempt.time)) {

                // Deny if the new funds would exceed the weekly limit
                if (history.week.total + loadAttempt.load_amount_value > 20000) {
                    accepted = false;
                }
                else {
                    const day = history.week.days.pop();
                    if (day) {
                        history.week.days.push(day);

                        // Validate the cases where the Day already exists (not the customer's first load attempt of the day)
                        if (day.hasInTimeRange(loadAttempt.time)) {

                            // Deny if new funds would exceed the daily limit
                            if (day.total + loadAttempt.load_amount_value > 5000) {
                                accepted = false;
                            }

                            // Deny if load attempt would excced the maximum number of load attempts
                            if (day.loadAttempts.length >= 3) {
                                accepted = false;
                            }
                        }
                    }
                }
            }
        }

        // Return the result
        return new LoadAttemptResult({
            accepted,
            customer_id: loadAttempt.customer_id,
            id: loadAttempt.id
        });
    }

    /** update()
     *  - Returns an new instance of state after apply the update
     *  - This function is non-destructive
     */
    update(loadAttempt: LoadAttempt): State {

        // Create a copy of the state
        const newState = new State(this);

        // Get the customer's history, add one if it doesn't exist
        let customerHistory = newState.history.get(loadAttempt.customer_id);
        if (!customerHistory) {
            customerHistory = new CustomerHistory();
            newState.history.set(loadAttempt.customer_id, customerHistory);
        }

        // Validate the load attempt and get a result
        const result = newState.validateLoad(loadAttempt);

        // If the load attempt was successful, add it to the customer's history
        if (result.accepted) {
            customerHistory.add(loadAttempt);
        }


        // Add the loadAttempt to history
        if (!customerHistory.loadAttempts.has(loadAttempt.id)) {
            customerHistory.loadAttempts.set(loadAttempt.id, loadAttempt);
        }

        // Add the result to ouput
        newState.output.push(result);

        // Return the new state
        return newState;
    }
}

/** Week
 *  - Represents a one week time block (7 days) of a user's history
 */
export class Week extends TimeBlock {
    days: Day[] = [];

    constructor(config?: {
        days?: Day[],
        end?: Date,
        start?: Date,
        time?: Date,
        total?: number
    }) {
        super(config);
        if (config) {
            if (config.days) {
                this.days.push(...config.days.map(day => new Day(day)));
            }
        }
    }


    /** add()
     *  - adds a loaded funds record to the week.
     */
    add(loadAttempt: LoadAttempt): void {

        // Create a new day when days is empty or if the previously recorded day is too far in the past.
        let day = this.days.pop();
        const isCorrectDay = (d: Day) => (d.start && d.end && d.start <= loadAttempt.time && loadAttempt.time <= d.end);
        if (!day) {
            day = new Day({time: loadAttempt.time});
        }
        else if (day && !isCorrectDay(day)) {
            this.days.push(day);
            day = new Day({time: loadAttempt.time});
        }

        // Increment the total loaded funds for the week
        this.total += loadAttempt.load_amount_value;

        // Update
        day.add(loadAttempt);
        this.days.push(day);
    }

    /** isInTimeRange()
     *  - determines whether a given date falls within range of the timeblock
     */
    hasInTimeRange(date: Date): boolean {
        return (this.start && this.end && this.start <= date  && date <= this.end) ? true : false;
    }

    /** setTimeRange()
     *  - sets the time range for the week
     */
    setTimeRange(date: Date): void {
        // Get day and week lengths in milliseconds
        const dayLength = 24 * 60 * 60 * 1000;
        const weekLength = 7 * dayLength;

        // Get the datetime for the last millisecond of the previous week
        const endOfLastWeek = new Date(date.getTime() - dayLength * date.getUTCDay());
        endOfLastWeek.setUTCHours(23, 59, 59, 999);

        // Set the start time to the first millisecond of the week
        this.start = new Date(endOfLastWeek.getTime() + 1);

        // Set the end time to the last millisecond of the week
        this.end = new Date(endOfLastWeek.getTime() + weekLength);
    }
}
