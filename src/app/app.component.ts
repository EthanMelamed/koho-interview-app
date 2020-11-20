// Angular Imports
import { Component } from '@angular/core';

// NPM Imports
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs/operators';

// App Imports
import { input, refresh } from './load-attempts.actions';
import { LoadAttempt, State } from './load-attempts.models';
import { LoadAttemptInputReaderService } from './load-attempt-input-reader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // Get a debounced observable for the state
  state$ = this.store.select('state').pipe(debounceTime(1000));
  processingFile = false;

  constructor(private store: Store<{state: State}>, private inputService: LoadAttemptInputReaderService) {
    this.state$.subscribe(state => {
      let output = '';
      state.output.forEach(result => {
        output += `{"id":"${result.id}","customer_id":"${result.customer_id}","accepted":${result.accepted}}\n`;
      });
      setTimeout(() => {
        console.log(output);
      }, 500);
      this.processingFile = false;
    });
  }

  /** onInput
   *  - Dispatches new input events when a new input file is added
   */
  onInput(file: File): void {

    this.processingFile = true;
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

  refresh(): void {
    this.processingFile = true;
    this.store.dispatch(refresh());
  }
}
