import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /** onInput
   *  - Dispatches new input events when a new input file is added
   */
  onInput(file: File): void {
  }
}
