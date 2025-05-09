import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Observable } from "rxjs";
import { Statement } from "../statement.model"; // Assuming this file contains your interface
import { map } from "rxjs";
import { PDFService } from "app/Services/pdf.service";
import { MatDialog } from "@angular/material/dialog";
import { StatementDialogComponent } from "../statement-dialog/statement-dialog.component";

@Component({
  selector: "app-statements-list",
  templateUrl: "./statements-list.component.html",
  styleUrls: ["./statements-list.component.scss"],
})
export class StatementsListComponent implements OnInit {
  statements$: Observable<Statement[]>;
  filteredStatements$: Observable<any[]>; // Filtered statements observable
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

    this.statements$ = this.firestore
      .collection("statements")
      .snapshotChanges() // Use snapshotChanges to get metadata along with document data
      .pipe(
        map((actions) => {
          console.log("Raw statements from Firestore:", actions); // Log raw data from Firestore

          // Map each Firestore document and include the document ID
          const mappedStatements = actions.map((a) => {
            const data = a.payload.doc.data() as any; // Get document data
            const id = a.payload.doc.id; // Get document ID
            console.log("Status for statement:", data.status); // Log the status of each statement

            // Return a new Statement instance including the ID
            return new Statement({ id, ...data });
          });

          return mappedStatements.sort((a, b) => {
            const dateA = new Date(a.invoiceDate).getTime();
            const dateB = new Date(b.invoiceDate).getTime();
            return dateB - dateA; // Newest to oldest
          });
        })
      );

    this.filteredStatements$ = this.statements$;
  }

  toggleSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  onSearch() {
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase(); // Convert search term to lowercase

      this.filteredStatements$ = this.statements$.pipe(
        map((statements) =>
          statements.filter(
            (statement) =>
              // Check if the customerName or invoiceNo matches the search term
              statement.customerName.toLowerCase().includes(searchTermLower) ||
              statement.invoiceNo.toString().includes(this.searchTerm)
          )
        )
      );
    } else {
      // If no search term, reset the filtered statements to show all
      this.filteredStatements$ = this.statements$;
    }
  }

  setFilter(filter: string) {
    this.currentFilter = filter;

    if (filter === "drafts") {
      // Query Firestore directly for draft statements
      this.filteredStatements$ = this.firestore
        .collection("statements", (ref) => ref.where("status", "==", "draft"))
        .valueChanges()
        .pipe(
          map((statements) => {
            console.log("Draft statements from Firestore:", statements); // Log draft statements
            return statements.map((statement) => new Statement(statement));
          })
        );
    } else {
      // Show all statements
      this.filteredStatements$ = this.statements$;
    }
  }

  openPDF(statement: Statement, string) {
    this.pdfService.generatePDFStatement(statement, string);
  }

  openDialog(statement: any) {
    console.log(statement.id);
    const dialogRef = this.dialog.open(StatementDialogComponent, {
      width: "400px",
      data: statement, // Pass the statement object, including its ID
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === "openPDF") {
        this.openPDF(statement, "open");
      } else if (result === "download") {
        // this.editStatement(statement);
        this.openPDF(statement, "download");
      } else if (result === true) {
        console.log("Statement deleted");
      }
    });
  }
}
