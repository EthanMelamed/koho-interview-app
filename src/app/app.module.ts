// Angular Imports
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    StoreModule.forRoot({state: loadAttemptsReducer}),
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
