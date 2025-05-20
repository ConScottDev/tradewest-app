import { Component, Inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EmailDialogComponent } from 'app/email-dialog/email-dialog.component';
import { PDFService } from 'app/Services/pdf.service';

@Component({
  selector: 'app-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrl: './invoice-dialog.component.scss'
})
export class InvoiceDialogComponent {
 
  constructor(
    public dialogRef: MatDialogRef<EmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public invoice: any,
    private firestore: AngularFirestore,
    private router: Router,
    private dialog: MatDialog,
    private pdfService: PDFService
  ) {}

  // Delete invoice from Firestore
  deleteInvoice() {
    console.log("Deleting invoice with ID:", this.invoice.id);  // Log the document ID
    this.firestore.collection('invoices').doc(this.invoice.id).delete()
      .then(() => {
        console.log('Invoice deleted successfully!');
        this.dialogRef.close(true);  // Close dialog and return success
      })
      .catch(error => {
        console.error('Error deleting invoice:', error);
      });
  }

  editInvoice() {
    this.dialogRef.close();  // Close the dialog
    this.router.navigate(['/edit-invoice', this.invoice.id]);  // Navigate to edit page with ID
  }

  sendEmail() {
    // Open dialog for user to enter email and message
    // const dialogRef = this.dialog.open(EmailDialogComponent);

    const dialogRef = this.dialog.open(EmailDialogComponent, {
      width: '400px',
      data: { invoice: this.invoice, type: 'invoice' }  // Pass the invoice here
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('Email dialog was closed');
    });
    
  }

  // Close dialog without action
  closeDialog() {
    this.dialogRef.close();
  }

  confirmPaidStatus(newStatus: boolean) {
  const action = newStatus ? 'mark this invoice as PAID' : 'mark this invoice as UNPAID';
  const confirmed = confirm(`Are you sure you want to ${action}?`);
  if (!confirmed) return;

  this.firestore
    .collection('invoices')
    .doc(this.invoice.id)
    .update({ paid: newStatus })
    .then(() => {
      this.invoice.paid = newStatus;
    });
}


}
