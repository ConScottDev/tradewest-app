import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { EmailDialogComponent } from 'app/email-dialog/email-dialog.component';
import { PDFService } from 'app/Services/pdf.service';
import pdfMake from "pdfmake/build/pdfmake";


@Component({
  selector: 'app-statement-dialog',
  templateUrl: './statement-dialog.component.html',
  styleUrls: ['./statement-dialog.component.scss']
})
export class StatementDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<StatementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public statement: any,
    private firestore: AngularFirestore,
    private router: Router,
    private dialog: MatDialog,
    private pdfService: PDFService
  ) {}

  // Delete statement from Firestore
  deleteStatement() {
    console.log("Deleting statement with ID:", this.statement.id);  // Log the document ID
    this.firestore.collection('statements').doc(this.statement.id).delete()
      .then(() => {
        console.log('Statement deleted successfully!');
        this.dialogRef.close(true);  // Close dialog and return success
      })
      .catch(error => {
        console.error('Error deleting statement:', error);
      });
  }

  editStatement() {
    this.dialogRef.close();  // Close the dialog
    this.router.navigate(['/edit-statement', this.statement.id]);  // Navigate to edit page with ID
  }

  sendEmail() {
    // Open dialog for user to enter email and message
    // const dialogRef = this.dialog.open(EmailDialogComponent);

    const dialogRef = this.dialog.open(EmailDialogComponent, {
      width: '400px',
      data: { statement: this.statement, type: 'statement' }  // Pass the statement here
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('Email dialog was closed');
    });
    
  }

  sendEmailWithPDF(email: string, message: string, pdfData: string) {
    // // Call backend API to send email with the PDF attached
    // const emailData = { toEmail: email, message, pdfAttachment: pdfData };
    
    // this.http.post('/api/send-statement-email', emailData)
    //   .subscribe(response => console.log('Email sent'), error => console.error('Error:', error));
  }

  // Close dialog without action
  closeDialog() {
    this.dialogRef.close();
  }
}
