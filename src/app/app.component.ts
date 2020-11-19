// Angular Imports
import { Component } from '@angular/core';

// NPM Imports
import { Store } from '@ngrx/store';

// App Imports
import { input } from './load-attempts.actions';
import { LoadAttempt, State } from './load-attempts.models';
import { LoadAttemptInputReaderService } from './load-attempt-input-reader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private store: Store<{state: State}>, private inputService: LoadAttemptInputReaderService) {
    // Subscribe to and log the current state to the console
    store.select('state').subscribe(state => {
      console.log('New State', state);
    });
  }

  /** onInput
   *  - Dispatches new input events when a new input file is added
   */
  onInput(file: File): void {

    // Extract the the load attempts from the file
    this.inputService.extractLoadAttemptsFromFile(file)
    .then((loadAttempts: LoadAttempt[]) => {

      // Dispatch an input event for each load attempt
      loadAttempts.forEach(loadAttempt => {
        this.store.dispatch(input({loadAttempt}));
      });
    })
    .catch((err: any) => {
      console.error('File input failed', err);
    });
  }
}
