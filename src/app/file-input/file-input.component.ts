// Angular Imports
import { Component, EventEmitter, HostListener, Output } from '@angular/core';

// App Imports
import { LoadAttempt } from '../load-attempts.models';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent {

  @Output() newFileEvent = new EventEmitter<File>();
  @Output() errorEvent = new EventEmitter<LoadAttempt[]>();

  constructor() { }


  /** onInput()
   *  - Emits a newFileEvent when a new file input on the component
   *  - Also responsible for reading and parsing the file
   */
  onInput(event: any): void {

    // Extract the file from the event, and emit a
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.newFileEvent.next(files[0]);
    }
  }

  /** onDrop()
   *  - handles drop events
   */
  @HostListener('drop', ['$event'])
  onDrop(event: Event): void {
    this.onInput(event);
  }
}
