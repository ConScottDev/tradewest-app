import { HttpClient } from "@angular/common/http";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EmailDialogComponent } from "app/email-dialog/email-dialog.component";

@Component({
  selector: "app-view-email-dialog",
  templateUrl: "./view-email-dialog.component.html",
  styleUrl: "./view-email-dialog.component.scss",
})
export class ViewEmailDialogComponent {
  emailContent: any; // Variable to store the email content

  constructor(
    public dialogRef: MatDialogRef<EmailDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any // Inject the email log data
  ) {
    console.log(this.data);
  }

  ngOnInit(): void {
    this.fetchEmailContent(this.data.messageId);
    console.log(this.data.messageId); // Fetch email content on initialization
  }

  fetchEmailContent(messageId: string): void {
    // Pass messageId as a query parameter, not in the path
    const isLocalhost = window.location.hostname === "localhost";

    const baseUrl = isLocalhost
      ? "http://127.0.0.1:5001/tradewest-c870e/us-central1/api"
      : "https://api-57uhydlj5q-uc.a.run.app";

    const apiUrl = `${baseUrl}/getemailContent?messageId=${messageId}`;
    this.http
      .get(
        apiUrl
      )
      .subscribe(
        (content) => {
          console.log('Email content fetched:', content); // Check the response content
          this.emailContent = content;
        },
        (error) => {
          console.error('Error fetching email content:', error);
        }
      );
  }

  // Close the dialog
  onClose(): void {
    this.dialogRef.close();
  }
}
