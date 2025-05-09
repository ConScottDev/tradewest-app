import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, of, tap } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { ViewEmailDialogComponent } from "./view-email-dialog/view-email-dialog.component";

@Component({
  selector: "app-emails",
  templateUrl: "./emails.component.html",
  styleUrl: "./emails.component.scss",
})
export class EmailsComponent {
  isLoading: boolean = true;  // Add a loading state
  emailLogs$: Observable<any[]>;
  filteredEmailLogs$: Observable<any[]>;
  searchTerm: string = "";

  emailLogs: any[] = [];

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchEmailLogs();
  }

  fetchEmailLogs(): void {
    this.isLoading = true;
    const isLocalhost = window.location.hostname === "localhost";
  
    // Use correct API URLs for localhost (Firebase Emulator) and production (Cloud Run)
    const baseUrl = isLocalhost
      ? "http://127.0.0.1:5001/tradewest-c870e/us-central1/api"  // Local emulator URL
      : "https://api-57uhydlj5q-uc.a.run.app";  // Cloud Run URL
  
    const apiUrl = `${baseUrl}/email-logs`;
    // Make the HTTP GET request using HttpClient (from Angular's HttpClientModule)
    this.emailLogs$ = this.http.get<any[]>(apiUrl)
      .pipe(
        tap(() => {
          this.isLoading = false
        }),
        catchError((error) => {
          console.error('Error fetching email logs:', error);
          return of([]);  // Return an empty array on error
        })
      );
    // Assign the filtered email logs (you can apply filters here if needed)
    this.filteredEmailLogs$ = this.emailLogs$;
    console.log(this.filteredEmailLogs$);
    this.isLoading = false

  }
  


  openEmailDialog(log: any): void {
    this.dialog.open(ViewEmailDialogComponent, {
      width: 'fit-content',   // Set width for the dialog
      data: log,        // Pass the email log data to the dialog
    });
  }
}
