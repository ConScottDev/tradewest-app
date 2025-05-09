import { HttpClient } from "@angular/common/http";
import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Invoice } from "app/invoices/invoice.model";
import { Quote } from "app/quotes/quote.model";
import { PDFService } from "app/Services/pdf.service";
import { Statement } from "app/statements/statement.model";
import { stat } from "fs";

@Component({
  selector: "app-email-dailog",
  templateUrl: "./email-dialog.component.html",
  styleUrl: "./email-dialog.component.scss",
})
export class EmailDialogComponent {
  email: string = "";
  message: string = "";
  subject: string = "";
  isSending: boolean = false;

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<EmailDialogComponent>,
    private pdfService: PDFService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      statement: Statement;
      invoice: Invoice;
      quote: Quote;
      type: string;
    } // Inject the statement object
  ) {
    console.log(this.data.invoice);
    console.log(this.data.type);
  }

  sendEmail() {
    if (this.data.type === "statement") {
      const statement = this.data.statement;
      const formattedCustomerName = statement.customerName.replace(/ /g, "_");

      console.log("formatted name: ", formattedCustomerName);

      // Show progress spinner while email is being sent
      this.isSending = true;
      const isLocalhost = window.location.hostname === "localhost";

      const baseUrl = isLocalhost
        ? "http://127.0.0.1:5001/tradewest-c870e/us-central1/api"
        : "https://api-57uhydlj5q-uc.a.run.app";

      const apiUrl = `${baseUrl}/send-email`;
      
      this.pdfService
        .generatePDFEmail(statement)
        .then((pdfBase64) => {
          this.http
            .post(
              apiUrl,
              {
                email: this.email,
                subject: this.subject,
                message: this.message,
                pdfData: pdfBase64,
                customerName: formattedCustomerName,
                statementNo: statement.invoiceNo,
                type: this.data.type,
              }
            )
            .subscribe(
              (response) => {
                console.log("Email sent successfully", response);

                // Hide the spinner after successful email sending
                this.isSending = false;

                // Show success notification
                this.snackBar.open("Email sent successfully!", "Close", {
                  duration: 3000,
                });

                this.dialogRef.close();
              },
              (error) => {
                console.error("Error sending email", error);

                // Hide the spinner in case of an error
                this.isSending = false;

                // Show error notification
                this.snackBar.open(
                  "Failed to send email. Please try again.",
                  "Close",
                  {
                    duration: 3000,
                  }
                );
              }
            );
        })
        .catch((error) => {
          console.error("Error generating PDF", error);

          // Hide the spinner in case of PDF generation error
          this.isSending = false;

          // Show error notification
          this.snackBar.open(
            "Failed to generate PDF. Please try again.",
            "Close",
            {
              duration: 3000,
            }
          );
        });
    } else if (this.data.type === "invoice") {
      const invoice = this.data.invoice;
      const formattedCustomerName = invoice.customerName.replace(/ /g, "_");

      console.log("formatted name: ", formattedCustomerName);

      // Show progress spinner while email is being sent
      this.isSending = true;
      const isLocalhost = window.location.hostname === "localhost";

      const baseUrl = isLocalhost
        ? "http://127.0.0.1:5001/tradewest-c870e/us-central1/api"
        : "https://api-57uhydlj5q-uc.a.run.app";

      const apiUrl = `${baseUrl}/send-email`;

      this.pdfService
        .generatePDFInvoiceEmail(invoice)
        .then((pdfBase64) => {
          this.http
            .post(
              apiUrl,
              {
                email: this.email,
                subject: this.subject,
                message: this.message,
                pdfData: pdfBase64,
                customerName: formattedCustomerName,
                statementNo: invoice.invoiceNo,
                type: this.data.type,
              }
            )
            .subscribe(
              (response) => {
                console.log("Email sent successfully", response);

                // Hide the spinner after successful email sending
                this.isSending = false;

                // Show success notification
                this.snackBar.open("Email sent successfully!", "Close", {
                  duration: 3000,
                });

                this.dialogRef.close();
              },
              (error) => {
                console.error("Error sending email", error);

                // Hide the spinner in case of an error
                this.isSending = false;

                // Show error notification
                this.snackBar.open(
                  "Failed to send email. Please try again.",
                  "Close",
                  {
                    duration: 3000,
                  }
                );
              }
            );
        })
        .catch((error) => {
          console.error("Error generating PDF", error);

          // Hide the spinner in case of PDF generation error
          this.isSending = false;

          // Show error notification
          this.snackBar.open(
            "Failed to generate PDF. Please try again.",
            "Close",
            {
              duration: 3000,
            }
          );
        });
    } else if (this.data.type === "quote") {
      const quote = this.data.quote;
      const formattedCustomerName = quote.customerName.replace(/ /g, "_");

      console.log("formatted name: ", formattedCustomerName);

      // Show progress spinner while email is being sent
      this.isSending = true;

      const isLocalhost = window.location.hostname === "localhost";

      const baseUrl = isLocalhost
        ? "http://127.0.0.1:5001/tradewest-c870e/us-central1/api"
        : "https://api-57uhydlj5q-uc.a.run.app";

      const apiUrl = `${baseUrl}/send-email`;

      this.pdfService
        .generatePDFQuoteEmail(quote)
        .then((pdfBase64) => {
          this.http
            .post(
              apiUrl,
              {
                email: this.email,
                subject: this.subject,
                message: this.message,
                pdfData: pdfBase64,
                customerName: formattedCustomerName,
                statementNo: quote.quoteNo,
                type: this.data.type,
              }
            )
            .subscribe(
              (response) => {
                console.log("Email sent successfully", response);

                // Hide the spinner after successful email sending
                this.isSending = false;

                // Show success notification
                this.snackBar.open("Email sent successfully!", "Close", {
                  duration: 3000,
                });

                this.dialogRef.close();
              },
              (error) => {
                console.error("Error sending email", error);

                // Hide the spinner in case of an error
                this.isSending = false;

                // Show error notification
                this.snackBar.open(
                  "Failed to send email. Please try again.",
                  "Close",
                  {
                    duration: 3000,
                  }
                );
              }
            );
        })
        .catch((error) => {
          console.error("Error generating PDF", error);

          // Hide the spinner in case of PDF generation error
          this.isSending = false;

          // Show error notification
          this.snackBar.open(
            "Failed to generate PDF. Please try again.",
            "Close",
            {
              duration: 3000,
            }
          );
        });
    }
  }
}
