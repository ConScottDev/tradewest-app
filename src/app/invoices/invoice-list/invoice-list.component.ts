import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs";
import { PDFService } from "app/Services/pdf.service";
import { MatDialog } from "@angular/material/dialog";
import { Invoice } from "../invoice.model";
import { InvoiceDialogComponent } from "../invoice-dialog/invoice-dialog.component";

@Component({
  selector: "app-invoice-list",
  templateUrl: "./invoice-list.component.html",
  styleUrl: "./invoice-list.component.scss",
})
export class InvoiceListComponent {
  invoices$: Observable<Invoice[]>;
  filteredInvoices$: Observable<Invoice[]>; // Filtered invoices observable
  currentFilter: string = "all";
  searchTerm: string = "";
  isSearchExpanded: boolean = false;

  constructor(
    private firestore: AngularFirestore,
    private pdfService: PDFService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log("Initializing component...");

    this.invoices$ = this.firestore
      .collection("invoices")
      .snapshotChanges() // Use snapshotChanges to get metadata along with document data
      .pipe(
        map((actions) => {
          console.log("Raw invoices from Firestore:", actions); // Log raw data from Firestore

          // Map each Firestore document and include the document ID
          const mappedInvoices = actions.map((a) => {
            const data = a.payload.doc.data() as any; // Get document data
            const id = a.payload.doc.id; // Get document ID
            console.log("Status for invoice:", data.status); // Log the status of each invoice

            // Return a new Invoice instance including the ID
            return new Invoice({ id, ...data });
          });

          console.log("Mapped invoices (with IDs):", mappedInvoices);

          // Sort invoices by invoiceDate (newest to oldest)
          return mappedInvoices.sort((a, b) => {
            const dateA = new Date(a.invoiceDate).getTime();
            const dateB = new Date(b.invoiceDate).getTime();
            return dateB - dateA; // Newest to oldest
          });
        })
      );

    this.filteredInvoices$ = this.invoices$;
  }

  toggleSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  onSearch() {
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase(); // Convert search term to lowercase

      this.filteredInvoices$ = this.invoices$.pipe(
        map((invoices) =>
          invoices.filter(
            (invoice) =>
              // Check if the customerName or invoiceNo matches the search term
              invoice.customerName.toLowerCase().includes(searchTermLower) ||
              invoice.invoiceNo.toString().includes(this.searchTerm)
          )
        )
      );
    } else {
      // If no search term, reset the filtered invoices to show all
      this.filteredInvoices$ = this.invoices$;
    }
  }

  setFilter(filter: string) {
    this.currentFilter = filter;

    if (filter === "drafts") {
      this.filteredInvoices$ = this.firestore
        .collection("invoices", (ref) => ref.where("status", "==", "draft"))
        .snapshotChanges()
        .pipe(
          map((actions) =>
            actions.map((a) => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return new Invoice({ id, ...data });
            })
          )
        );
    } else if (filter === "paid") {
      this.filteredInvoices$ = this.firestore
        .collection("invoices", (ref) => ref.where("paid", "==", true))
        .snapshotChanges()
        .pipe(
          map((actions) =>
            actions.map((a) => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return new Invoice({ id, ...data });
            })
          )
        );
    } else if (filter === "unpaid") {
      this.filteredInvoices$ = this.firestore
        .collection("invoices", (ref) => ref.where("paid", "==", false))
        .snapshotChanges()
        .pipe(
          map((actions) =>
            actions.map((a) => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return new Invoice({ id, ...data });
            })
          )
        );
    } else if (filter === "all") {
      this.filteredInvoices$ = this.invoices$; // ✅ Always reset to original stream
    }
  }

  openPDF(invoice: Invoice, string) {
    this.pdfService.generatePDFInvoice(invoice, string);
  }

  openDialog(invoice: any) {
    console.log(invoice.id);
    const dialogRef = this.dialog.open(InvoiceDialogComponent, {
      width: "400px",
      data: invoice, // Pass the invoice object, including its ID
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === "openPDF") {
        this.openPDF(invoice, "open");
      } else if (result === "download") {
        // this.editinvoice(invoice);
        this.openPDF(invoice, "download");
      } else if (result === true) {
        console.log("Invoice deleted");
      }
    });
  }

  hasBeenMarkedAsPaid(invoice: any): boolean {
  return invoice.hasOwnProperty('paid');
}

isPaid(invoice: any): boolean {
  return invoice.paid === true;
}

isUnpaid(invoice: any): boolean {
  return invoice.paid === false;
}



}
