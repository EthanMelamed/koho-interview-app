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

    /** isInTimeRange()
     *  - determines whether a given date falls within range of the timeblock
     */
    hasInTimeRange(date: Date): boolean {
        return (this.start && this.end && this.start <= date && date <= this.end) ? true : false;
    }

    abstract add(loadAttempt: LoadAttempt): boolean;
    protected abstract setTimeRange(date: Date): void;
}

/** CustomerHistory
 *  - Represents the load attempt history for a single user
 */
export class CustomerHistory {

    // A map to keep track of past laod attempts. Used to search for duplicate ids, and fast mapping with results
    loadAttempts: Map<string, LoadAttempt> = new Map<string, LoadAttempt>();

    // Keeps track of the current week's load attempt for verification purposes
    lastWeek: Week | undefined;

    constructor(config?: {
        loadAttempts?: Map<string, LoadAttempt>,
        lastWeek?: Week
    }) {
        if (config) {
            if (config.lastWeek) {
                this.lastWeek = new Week(config.lastWeek);
            }
            if (config.loadAttempts) {
                this.loadAttempts = new Map(config.loadAttempts);
            }
        }
    }

    add(loadAttempt: LoadAttempt): boolean {

        // Add load attempt
        if (!this.loadAttempts.has(loadAttempt.id)) {
            this.loadAttempts.set(loadAttempt.id, loadAttempt);
        }
        else {
            throw new Error();
        }

        // Create a new week when weeks is empty or if the previously recorded week is too far in the past.
        if (!this.lastWeek || !this.lastWeek.hasInTimeRange(loadAttempt.time)) {
            this.lastWeek = new Week({time: loadAttempt.time});
        }

        // Update
        return this.lastWeek.add(loadAttempt);
    }
}

/** Day
 *  - Represents a one day time block (24 hours) of a user's history
 */
export class Day extends TimeBlock {
    loadAttempts = 0;

    constructor(config?: {
        end?: Date,
        loadAttempts?: number,
        start?: Date,
        time?: Date,
        total?: number
    }) {
        super(config);
        if (config) {
            if (config.loadAttempts) {
                this.loadAttempts = config.loadAttempts;
            }
        }
    }

    // Add a load attempt to the day
    add(loadAttempt: LoadAttempt): boolean {

        // Throw an error if the load attempt was not made on this day
        if (!this.hasInTimeRange(loadAttempt.time)) {
            throw new Error();
        }


        // Deny if new funds would exceed the daily limit
        if (this.total + loadAttempt.load_amount_value > 5000) {
            return false;
        }

        // Deny if load attempt would excced the maximum number of load attempts
        if (this.loadAttempts >= 3) {
            return false;
        }

        // Increment the number of load attempts and the total for the day
        this.loadAttempts++;
        this.total += loadAttempt.load_amount_value;

        // Return true since add was successful
        return true;
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

        // Try to add the loadAttempt
        const result = customerHistory.add(loadAttempt);

        // Add the result to ouput
        newState.output.push(new LoadAttemptResult({
            accepted: result,
            customer_id: loadAttempt.customer_id,
            id: loadAttempt.id
        }));

        // Return the new state
        return newState;
    }
}

/** Week
 *  - Represents a one week time block (7 days) of a user's history
 */
export class Week extends TimeBlock {
    lastDay: Day | undefined;

    constructor(config?: {
        lastDay?: Day,
        end?: Date,
        start?: Date,
        time?: Date,
        total?: number
    }) {
        super(config);
        if (config) {
            if (config.lastDay) {
                this.lastDay = new Day(config.lastDay);
            }
        }
    }

    /** add()
     *  - adds a loaded funds record to the week.
     */
    add(loadAttempt: LoadAttempt): boolean {

        // Validate
        if (!this.hasInTimeRange(loadAttempt.time)) {
            throw new Error();
        }

        // Deny if the new funds would exceed the weekly limit
        else if (this.total + loadAttempt.load_amount_value > 20000) {
            return false;
        }

        // Try adding load attempt to day
        let day = this.lastDay;
        let added: boolean;
        if (!day || !day.hasInTimeRange(loadAttempt.time)) {
            day = new Day({time: loadAttempt.time});
        }
        added = day.add(loadAttempt);

        // If the funds were added, increment the total loaded funds for the week
        if (added) {
            this.total += loadAttempt.load_amount_value;
        }

        // Update
        this.lastDay = day;

        // Return result
        return added;
    }


    /** setTimeRange()
     *  - sets the time range for the week
     */
    setTimeRange(date: Date): void {
        // Get day and week lengths in milliseconds
        const dayLength = 24 * 60 * 60 * 1000;
        const weekLength = 7 * dayLength;

        // Get the datetime for the last millisecond of the previous week
        const endOfLastWeek = new Date(date.getTime() - dayLength * (date.getUTCDay() || 7));
        endOfLastWeek.setUTCHours(23, 59, 59, 999);

        // Set the start time to the first millisecond of the week
        this.start = new Date(endOfLastWeek.getTime() + 1);

        // Set the end time to the last millisecond of the week
        this.end = new Date(endOfLastWeek.getTime() + weekLength);
    }
}
