// Angular Imports
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// NPM Imports
import { StoreModule } from '@ngrx/store';

// App Imports
import { AppComponent } from './app.component';
import { FileInputComponent } from './file-input/file-input.component';
import { loadAttemptsReducer } from './load-attempts.reducer';

@NgModule({
  declarations: [
    AppComponent,
    FileInputComponent
  ],
  imports: [
    BrowserModule,
    StoreModule.forRoot({state: loadAttemptsReducer})
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
