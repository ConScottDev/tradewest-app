import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs";
import { PDFService } from "app/Services/pdf.service";
import { MatDialog } from "@angular/material/dialog";
import { Quote } from "../quote.model";
import { QuoteDialogComponent } from "../quote-dialog/quote-dialog.component";

@Component({
  selector: 'app-quote-list',
  templateUrl: './quote-list.component.html',
  styleUrl: './quote-list.component.scss'
})
export class QuoteListComponent {

  quotes$: Observable<Quote[]>;
  filteredQuotes$: Observable<Quote[]>; // Filtered quotes observable
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

    this.quotes$ = this.firestore
      .collection("quotes")
      .snapshotChanges() // Use snapshotChanges to get metadata along with document data
      .pipe(
        map((actions) => {
          console.log("Raw quotes from Firestore:", actions); // Log raw data from Firestore

          // Map each Firestore document and include the document ID
          const mappedQuotes = actions.map((a) => {
            const data = a.payload.doc.data() as any; // Get document data
            const id = a.payload.doc.id; // Get document ID
            console.log("Status for quote:", data.status); // Log the status of each invoice

            // Return a new Quote instance including the ID
            return new Quote({ id, ...data });
          });

          return mappedQuotes.sort((a, b) => {
            const dateA = new Date(a.quoteDate).getTime();
            const dateB = new Date(b.quoteDate).getTime();
            return dateB - dateA; // Newest to oldest
          });
        })
      );

    this.filteredQuotes$ = this.quotes$;
  }

  toggleSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  onSearch() {
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();  // Convert search term to lowercase
  
      this.filteredQuotes$ = this.quotes$.pipe(
        map(quotes =>
          quotes.filter(quote => 
            // Check if the customerName or quoteNo matches the search term
            quote.customerName.toLowerCase().includes(searchTermLower) || 
            quote.quoteNo.toString().includes(this.searchTerm)
          )
        )
      );
    } else {
      // If no search term, reset the filtered quotes to show all
      this.filteredQuotes$ = this.quotes$;
    }
  }
  

  setFilter(filter: string) {
    this.currentFilter = filter;

    if (filter === "drafts") {
      // Query Firestore directly for draft quotes
      this.filteredQuotes$ = this.firestore
        .collection("quotes", (ref) => ref.where("status", "==", "draft"))
        .valueChanges()
        .pipe(
          map((quotes) => {
            console.log("Draft quotes from Firestore:", quotes); // Log draft quotes
            return quotes.map((quote) => new Quote(quote));
          })
        );
    } else {
      // Show all quotes
      this.filteredQuotes$ = this.quotes$;
    }
  }

  openPDF(quote: Quote, string) {
    this.pdfService.generatePDFQuote(quote, string);
  }

  openDialog(quote: any) {
    console.log(quote.id);
    const dialogRef = this.dialog.open(QuoteDialogComponent, {
      width: "400px",
      data: quote, // Pass the quote object, including its ID
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === "openPDF") {
        this.openPDF(quote, "open");
      } else if (result === "download") {
        // this.editquote(quote);
        this.openPDF(quote, "download")
      } else if (result === true) {
        console.log("Quote deleted");
      }
    });
  }
}
