import { Component, Inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EmailDialogComponent } from 'app/email-dialog/email-dialog.component';
import { Invoice } from 'app/invoices/invoice.model';
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

  getNextInvoiceNumber(): Promise<number> {
  return this.firestore
    .collection<Invoice>("invoices", (ref) =>
      ref.orderBy("invoiceNo", "desc").limit(1)
    )
    .get()
    .toPromise()
    .then((querySnapshot) => {
      let newInvoiceNo = 16160;
      querySnapshot.forEach((doc) => {
        const lastInvoice = doc.data() as Invoice;
        newInvoiceNo = lastInvoice.invoiceNo + 1;
      });
      return newInvoiceNo;
    });
}




  confirmConvertToInvoice() {
  const confirmed = confirm('Are you sure you want to convert this quote to an invoice?');
  if (!confirmed) return;

  this.getNextInvoiceNumber().then((newInvoiceNo) => {
    const newId = this.firestore.createId(); // ✅ generates unique ID
  const newInvoice = new Invoice({
      id: newId, // ✅ explicitly assign valid ID,
    invoiceNo: newInvoiceNo,
    customerName: this.quote.customerName,
    invoiceDate: new Date(),
    address1: this.quote.address1 || '',
    address2: this.quote.address2 || '',
    address3: this.quote.address3 || '',
    address4: this.quote.address4 || '',
    products: this.quote.products || [],
    additionalDetails: this.quote.additionalDetails || '',
    status: 'final',
  });

  this.firestore
  .collection('invoices')
  .doc(newId)
  .set({ ...newInvoice }) // ✅ spread to plain object
  .then(() => {
    this.dialogRef.close();
    this.router.navigate(['/invoices-list']);
  });
});


}

}
