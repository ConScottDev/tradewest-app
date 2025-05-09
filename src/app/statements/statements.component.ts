import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { catchError, first, map, Observable, of } from "rxjs";
import { ChangeDetectorRef } from "@angular/core";
import { InvoiceNoValidatorService } from "app/Services/invoiceValidator.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormArray,
  ValidationErrors,
} from "@angular/forms";
import { Product, Statement } from "./statement.model";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { StatementDialogComponent } from "./statement-dialog/statement-dialog.component";
import { PDFService } from "app/Services/pdf.service";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: "app-statements",
  templateUrl: "./statements.component.html",
  styleUrls: ["./statements.component.scss"],
})
export class StatementsComponent implements OnInit {
  invoice = new Statement();
  statements$: Observable<Statement[]>;
  vat: number;
  paidInFull = "";
  paidIF = false;
  base64Image: string;
  form: FormGroup;
  invoiceNoExists: boolean = false;

  ngOnInit() {
    this.generateStatementNo();
    this.form = this.fb.group({
      customerName: ["", Validators.required],
      address1: ["", Validators.required],
      address2: [""],
      address3: [""],
      address4: [""],
      invoiceNo: [
        "",
        {
          validators: [Validators.required],
          asyncValidators: [this.invoiceNoExistsValidator()],
        },
      ],
      invoiceDate: ["", Validators.required],
      products: this.fb.array([this.createProduct()]), // Add form array if needed for products
      paidInFull: [false],
      status: ["final"],
    });
  }

  constructor(
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef,
    public invoiceNoValidator: InvoiceNoValidatorService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private pdfService: PDFService
  ) {
    //image location
    const dateSendingToServer = new DatePipe("en-US").transform(
      this.invoice.invoiceDate,
      "dd/MM/yyyy"
    );
    console.log(dateSendingToServer);
    this.convertImageToBase64();

    this.statements$ = this.firestore
      .collection("statements", (ref) =>
        ref.orderBy("invoiceDate", "desc").limit(6)
      )
      .snapshotChanges()
      .pipe(
        map((actions) => {
          const statements = actions.map((a) => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return new Statement({ id, ...data });
          });
          return statements; // Return the array of statements
        }),
        catchError((error) => {
          console.error("Error fetching recent statements:", error);
          return of([]); // Return an empty array if there's an error
        })
      );
  }
  
  generateStatementNo(){
    this.firestore
      .collection<Statement>("statements", (ref) =>
        ref.orderBy("invoiceNo", "desc").limit(1)
      ) // Query for the last invoice
      .get()
      .subscribe((querySnapshot) => {
        let newInvoiceNo = 100001; // Default value in case no invoice exists
        querySnapshot.forEach((doc) => {
          const lastInvoice = doc.data() as Statement; // Cast the document data to the Invoice model
          newInvoiceNo = lastInvoice.invoiceNo + 1; // Increment the highest invoiceNo
        });
        this.form.get("invoiceNo").setValue(newInvoiceNo); // Set the new invoice number
      });
  }

  get products(): FormArray {
    return this.form.get("products") as FormArray;
  }

  // Method to create a new product form group
  createProduct(): FormGroup {
    return this.fb.group({
      date: ["", Validators.required],
      description: ["", Validators.required],
      amount: ["", [Validators.required, Validators.min(0)]],
      received: ["", [Validators.required, Validators.min(0)]],
    });
  }

  // Add a new product row to the products array
  addProduct() {
    this.products.push(this.createProduct());
  }

  // Remove a product from the products array
  removeProduct(index: number) {
    this.products.removeAt(index);
  }

  saveAsDraft() {
    this.form.get("status").setValue("draft");
  
    const invoiceDateControl = this.form.get("invoiceDate");
  
    // Check if invoiceDate is a Moment object, and convert it to a JavaScript Date object
    if (invoiceDateControl.value && typeof invoiceDateControl.value.toDate === 'function') {
      invoiceDateControl.setValue(invoiceDateControl.value.toDate()); // Convert Moment to Date
    }
  
    // Set to today's date if no custom date has been set
    if (!invoiceDateControl.value) {
      invoiceDateControl.setValue(new Date()); // Default to today's date
    }
  
    // Extract the form data, including the correct date format
    const draftInvoiceData = this.form.value;
  
    this.saveInvoiceToFirestore(draftInvoiceData)
      .then(() => {
        this.snackBar.open("Draft saved successfully!", "Close", {
          duration: 3000,
        });
  
        this.form.reset(); // Prevent duplicate entries
      })
      .catch((error) => {
        console.error("Error saving draft to Firestore:", error);
      });
  }

  invoiceNoExistsValidator(): (
    control: AbstractControl
  ) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.firestore
        .collection("statements", (ref) =>
          ref.where("invoiceNo", "==", control.value)
        )
        .snapshotChanges()
        .pipe(
          first(), // Make sure the observable completes after the first value is emitted
          map((statements) => {
            const exists = statements.length > 0;
            console.log("exists", exists); // Log the result for debugging

            // Return the error object if duplicate exists, otherwise return null
            return exists ? { invoiceNoExists: true } : null;
          }),
          catchError(() => of(null)) // Handle errors in case Firestore fails
        );
    };
  }

  checkInvoiceNo(invoiceNo: number) {
    this.firestore
      .collection("statements", (ref) =>
        ref.where("invoiceNo", "==", invoiceNo)
      )
      .snapshotChanges()
      .subscribe((statements) => {
        this.invoiceNoExists = statements.length > 0;
        console.log(this.invoiceNoExists);
        this.cdr.detectChanges(); // Trigger change detection manually
      });
  }

  convertImageToBase64() {
    const imgPath = "/assets/img/tradewest-mobile-full.png"; // Adjust the image path as needed
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.base64Image = reader.result as string;
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", imgPath);
    xhr.responseType = "blob";
    xhr.send();
  }

  checkboxChange(event) {
    console.log(event);
  }

  convertToPlainObject(invoice: Statement): any {
    return {
      customerName: invoice.customerName,
      address1: invoice.address1,
      address2: invoice.address2,
      address3: invoice.address3,
      address4: invoice.address4,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      products: invoice.products.map((p: any) => ({
        date: p.date,
        description: p.description,
        amount: p.amount,
        received: p.received,
      })),
      status: invoice.status ?? "draft"
    };
  }
  saveInvoiceToFirestore(invoiceData: Statement) {
    const plainInvoiceData = this.convertToPlainObject(invoiceData);
    console.log(plainInvoiceData);
    return this.firestore.collection("statements").add(plainInvoiceData);
  }
  generatePDF(action = "open", products: FormArray) {
    // Access form values once
    const invoiceData = this.form.value;

    const productsArray = products.controls.map((product: FormGroup) => {
      return new Product(product.value); // Assuming Product class takes an object in its constructor
    });

    const statement = new Statement({ ...invoiceData, products: productsArray});

    const formattedCustomerName = statement.customerName.replace(/ /g, "_");

    const dateSendingToServer = new DatePipe("en-US").transform(
      invoiceData.invoiceDate,
      "dd/MM/yyyy"
    );

    // Prepare the PDF definition
    const docDefinition = {
      content: [
        {
          columns: [
            {
              image: this.base64Image,
              width: 120,
              margin: [0, 30, 0, 10],
            },
            {
              text: "Statement",
              bold: true,
              alignment: "right",
              fontSize: 18,
              margin: [0, 50, 65, 0],
            },
          ],
        },
        {
          text: "Jetland Sales Ltd T/A Tradewest",
          bold: true,
          margin: [0, 0, 0, 10],
          lineHeight: 1.4,
        },
        {
          columns: [
            {
              width: 150,
              margin: [0, 0, 0, 20],
              text: "IDA Business PK \n Tubbercurry \n Co Sligo. F91T296 \n 085-1950800 \n info@tradewest.ie \n VAT: IE3599817CH",
              fontSize: 12,
              lineHeight: 1.4,
            },
            [
              {
                width: 300,
                text: "Statement For",
                bold: true,
                fontSize: 12,
                lineHeight: 1.4,
              },
              {
                width: 300,
                text: statement.customerName + "\n" + statement.getFullAddress(),
                alignment: "left",
                lineHeight: 1.4,
              },
            ],
            {
              width: 100,
              text: "Date: \n Statement No.:",
              margin: [0, 0, 0, 0],
              fontSize: 12,
              lineHeight: 1.4,
            },
            {
              width: 70,
              text: dateSendingToServer + "\n" + statement.invoiceNo,
              fontSize: 12,
              lineHeight: 1.4,
            },
          ],
        },
        {
          table: {
            headerRows: 1,
            style: "tableFont",
            fontSize: 12,
            heights: 15,
            widths: ["auto", "*", "auto", "auto"],
            body: [
              [
                { text: "Date", style: "tableFont" },
                { text: "Description", style: "tableFont" },
                { text: "Amount", style: "tableFont" },
                { text: "Received", style: "tableFont" },
              ],
              ...statement.products.map((p) => [
                new DatePipe("en-US").transform(p.date, "dd/MM/yyyy"),
                p.description,
                "€" + p.amount,
                "€" + p.received,
              ]),
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
            ],
          },
          layout: {
            hLineColor: (i, node) =>
              i === 0 || i === node.table.body.length ? "black" : "gray",
            vLineColor: (i, node) =>
              i === 0 || i === node.table.widths.length ? "black" : "gray",
          },
        },
        {
          columns: [
            [
              {
                text: "Total Amount",
                alignment: "right",
                margin: [0, 5, -180, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "Total Received",
                alignment: "right",
                margin: [0, 5, -180, 0],
                bold: true,
                fontSize: 12,
                lineHeight: 1.2,
              },
            ],
            [
              {
                text:
                  "€" +
                  statement.products
                    .reduce((total, p) => total + p.amount, 0)
                    .toFixed(2),
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text:
                  "€" +
                  statement.products
                    .reduce((total, p) => total + p.received, 0)
                    .toFixed(2),
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
            ],
          ],
        },
      ],
      styles: {
        sectionHeader: {
          bold: true,
          decoration: "underline",
          fontSize: 14,
          margin: [0, 15, 0, 15],
        },
        tableFont: {},
      },
    };

    // Handle PDF actions (download, print, or open)
    const pdfAction = pdfMake.createPdf(docDefinition);
    if (action === "download") {
      pdfAction.download(`${formattedCustomerName}_${statement.invoiceNo}.pdf`);
    } else if (action === "print") {
      pdfAction.print();
    } else {
      pdfAction.open();
    }

    // Save to Firestore
    this.saveInvoiceToFirestore(statement)
      .then(() => {
        console.log("Statement saved successfully!");
        this.router.navigate(["/statements-list"]); // Navigate to edit page with ID
      })
      .catch((error) => {
        console.error("Error saving invoice to Firestore: ", error);
      });
  }

  viewAllStatements() {
    this.router.navigate(["/statements-list"]); // Navigate to edit page with ID
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
      } else if (result === "edit") {
        // this.editStatement(statement);
      } else if (result === true) {
        console.log("Statement deleted");
      }
    });
  }

  openPDF(statement: Statement, string: "open") {
    this.pdfService.generatePDFStatement(statement, string);
  }
}
