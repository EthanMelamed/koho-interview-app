/** CustomerHistory
 *  - Represents the load attempt history for a single user
 */
export class CustomerHistory {
    weeks: Week[] = [];
    usedIds: Set<string> = new Set<string>();

    constructor(config?: {
        weeks?: Week[],
        used_ids?: Set<string>
    }) {
        if (config) {
            if (config.weeks) {
                this.weeks.push(...config.weeks.map(week => new Week(week)));
            }
            if (config.used_ids) {
                this.usedIds = new Set(config.used_ids);
            }
        }
    }

    add(loadAttempt: LoadAttempt): void {
        // WRITE LOGIC TO UPDATE HISTORY WITH NEW LOAD ATTEMPT
    }
}

/** Day
 *  - Represents a one day time block (24 hours) of a user's history
 */
export class Day {
    loadAttempts: LoadAttempt[] = [];

    constructor(config?: {
        loadAttempts?: LoadAttempt[]
    }) {
        if (config && config.loadAttempts) {
            this.loadAttempts.push(...config.loadAttempts.map(loadAttempt => new LoadAttempt(loadAttempt)));
        }
    }

    add(loadAttempt: LoadAttempt): void {
        // WRITE LOGIC TO UPDATE HISTORY WITH NEW LOAD ATTEMPT
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
        this.time = config.time;
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

    validateLoad(loadAttempt: LoadAttempt): LoadAttemptResult {
        let accepted = false;
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

        const result = newState.validateLoad(loadAttempt);

        // If the load attempt was successful, add it to the customer's history
        if(result.accepted) {
            customerHistory.add(loadAttempt);
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
export class Week {
    days: Day[] = [];

    constructor(config?: {
        days?: Day[]
    }) {
        if (config && config.days) {
            this.days.push(...config.days.map(day => new Day(day)));
        }
    }

    add(loadAttempt: LoadAttempt): void {
        // WRITE LOGIC TO UPDATE HISTORY WITH NEW LOAD ATTEMPT
    }
}
