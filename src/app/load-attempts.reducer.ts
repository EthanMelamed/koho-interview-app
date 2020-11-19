// NPM Imports
import { createReducer, on } from '@ngrx/store';

// App Imports
import { input } from './load-attempts.actions';
import { CustomerHistory, LoadAttempt, LoadAttemptResult, State } from './load-attempts.models';

export const initialState: State = new State({
    history: new Map<string, CustomerHistory>(),
    output: []
});

export const loadAttemptsReducer = createReducer(
    initialState,
    on(input, reduce)
);

/** reduce()
 *  - Processes an Action containing a list of load attempts and updates state
 */
function reduce(state: State, action: { loadAttempt: LoadAttempt }): State {

    // Update state
    const newState = state.update(action.loadAttempt);

    // Add the result to the output
    newState.output.push();

    // return the new state
    return newState;
}
