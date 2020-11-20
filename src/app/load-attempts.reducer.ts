// NPM Imports
import { createReducer, on } from '@ngrx/store';

// App Imports
import { input, refresh } from './load-attempts.actions';
import { CustomerHistory, LoadAttempt, LoadAttemptResult, State } from './load-attempts.models';

export const initialState: State = new State({
    history: new Map<string, CustomerHistory>(),
    output: []
});

export const loadAttemptsReducer = createReducer(
    initialState,
    on(input, reduce),
    on(refresh, refreshReduce)
);

export function refreshReduce(state: State): State {
    return initialState;
}

/** reduce()
 *  - Processes an Action containing a list of load attempts and updates state
 */
export function reduce(state: State, action: { loadAttempt: LoadAttempt }): State {

    // Update state
    try {
        const newState = state.update(action.loadAttempt);
        return newState;
    }
    catch (e) {
        // state was not updated
        return state;
    }
}
