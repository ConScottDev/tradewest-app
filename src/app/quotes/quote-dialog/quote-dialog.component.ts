import { Component, Inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EmailDialogComponent } from 'app/email-dialog/email-dialog.component';
import { PDFService } from 'app/Services/pdf.service';

@Component({
  selector: "app-quote-dialog",
  templateUrl: "./quote-dialog.component.html",
  styleUrl: "./quote-dialog.component.scss",
})
export class QuoteDialogComponent {
  
 
  constructor(
    public dialogRef: MatDialogRef<EmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public quote: any,
    private firestore: AngularFirestore,
    private router: Router,
    private dialog: MatDialog,
    private pdfService: PDFService
  ) {}

  // Delete quote from Firestore
  deleteQuote() {
    console.log("Deleting quote with ID:", this.quote.id);  // Log the document ID
    this.firestore.collection('quotes').doc(this.quote.id).delete()
      .then(() => {
        console.log('Quote deleted successfully!');
        this.dialogRef.close(true);  // Close dialog and return success
      })
      .catch(error => {
        console.error('Error deleting quote:', error);
      });
  }

  editQuote() {
    this.dialogRef.close();  // Close the dialog
    this.router.navigate(['/edit-quote', this.quote.id]);  // Navigate to edit page with ID
  }

  sendEmail() {
    // Open dialog for user to enter email and message
    // const dialogRef = this.dialog.open(EmailDialogComponent);

    const dialogRef = this.dialog.open(EmailDialogComponent, {
      width: '400px',
      data: { quote: this.quote, type: 'quote' }  // Pass the quote here
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('Email dialog was closed');
    });
    
  }

  // Close dialog without action
  closeDialog() {
    this.dialogRef.close();
  }

}
