// NPM Imports
import { createAction, props } from '@ngrx/store';

// App Imports
import { LoadAttempt } from './load-attempts.models';

// The action of a new load attempt
export const input = createAction('[Input] Load Attempts', props<{loadAttempt: LoadAttempt}>());
export const refresh = createAction('[Input] Refresh');
