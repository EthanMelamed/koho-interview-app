// Angular Imports
import { Injectable } from '@angular/core';

// App Imports
import { LoadAttempt } from './load-attempts.models';

/** LoadAttemptInputReaderService
 *  - A service responsible for reading the load attempt inputs from a file
 */
@Injectable({
  providedIn: 'root'
})
export class LoadAttemptInputReaderService {

  constructor() { }

  /** extractLoadAttemptsFromFile()
   *  - Extracts load attempts from a file and returns them as a promise
   */
  extractLoadAttemptsFromFile(file: File): Promise<LoadAttempt[]> {
    if (!file) {
      return Promise.reject('Could not find null file');
    }
    return new Promise<LoadAttempt[]>((resolve, reject) => {

      // Extract the contents from the file as a string
      this.readFileContents(file)
      .then((fileContents: string) => {
        try {

          // Parse the load attempts from the string and resolve the promise
          const loadAttempts = this.parseLoadAttempts(fileContents);
          resolve(loadAttempts);
        }
        catch (err) {

          // Reject and log an error to the console if the input file does not parse properly
          console.error('Parsing Error, Input file does not conform to specs (/{"id": "<string>","customer_id": "<string>", "load_amount": "<string>", "time":"<date>"}\n)*/');
          reject(err);
        }
      })
      .catch(err => {

        // Reject and log an error if there was an issue reading the file
        console.error('File could not be read', err);
        reject(err);
      });
    });
  }

  /** parseLoadAttempts()
   *  - parses a block of text with '\n' delimited lines into LoadAttempt objects
   */
  parseLoadAttempts(text: string): LoadAttempt[] {
    let loadAttempts: LoadAttempt[] = [];

    if (text) {

      // Extract LoadAttempt objects from the string by
      loadAttempts =

        // splitting text block into an array of lines,
        text.split('\n')

        // filtering out blank lines,
        .filter(line => line)

        // and finally parsing the remaining lines into load attempt objects
        .map(loadAttempt => new LoadAttempt(JSON.parse(loadAttempt)));
    }
    return loadAttempts;
  }

  /** readFileContents()
   *  - Gets the contents of a text file as a string
   */
  readFileContents(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {

      // Immediately reject if the input is empty
      if (!file) {
        reject();
      }

      // Initialize a FileReader
      const reader = new FileReader();

      reader.onload = (e) => {

        // Once loaded, extract the contents as a string and resolve in the Promise, reject if there are no contents
        const fileContents = reader.result;
        if (fileContents) {
          const text = fileContents.toString();
          resolve(text);
        }
        else {
          reject();
        }
      };

      // Load the file
      reader.readAsText(file);
    });
  }
}
