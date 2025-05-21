import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
// import pdfMake from "pdfmake/build/pdfmake";
// import pdfFonts from "pdfmake/build/vfs_fonts";
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
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { PDFService } from "app/Services/pdf.service";
import { Product, Quote } from "./quote.model";
import { QuoteDialogComponent } from "./quote-dialog/quote-dialog.component";

const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");

pdfMake.vfs = pdfFonts.vfs;

@Component({
  selector: "app-quotes",
  templateUrl: "./quotes.component.html",
  styleUrl: "./quotes.component.scss",
})
export class QuotesComponent {
  quote = new Quote();
  quotes$: Observable<Quote[]>;
  vat: number;
  paidInFull = "";
  paidIF = false;
  base64Image: string;
  form: FormGroup;
  quoteNoExists: boolean = false;

  ngOnInit() {
    this.generateQuoteNo();
    this.form = this.fb.group({
      customerName: ["", Validators.required],
      address1: ["", Validators.required],
      address2: [""],
      address3: [""],
      address4: [""],
      quoteNo: [
        "",
        {
          validators: [Validators.required],
          asyncValidators: [this.quoteNoExistsValidator()],
        },
      ],
      quoteDate: ["", Validators.required],
      products: this.fb.array([this.createProduct()]), // Add form array if needed for products
      paidInFull: [false],
      status: ["final"],
    });
  }

  constructor(
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef,
    public quoteNoValidator: InvoiceNoValidatorService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private pdfService: PDFService
  ) {
    //image location
    const dateSendingToServer = new DatePipe("en-US").transform(
      this.quote.quoteDate,
      "dd/MM/yyyy"
    );
    console.log(dateSendingToServer);
    this.convertImageToBase64();

    this.quotes$ = this.firestore
      .collection("quotes", (ref) => ref.orderBy("quoteDate", "desc").limit(6))
      .snapshotChanges()
      .pipe(
        map((actions) => {
          const quotes = actions.map((a) => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return new Quote({ id, ...data });
          });
          return quotes; // Return the array of quotes
        }),
        catchError((error) => {
          console.error("Error fetching recent quotes:", error);
          return of([]); // Return an empty array if there's an error
        })
      );
  }

  generateQuoteNo() {
    this.firestore
      .collection<Quote>("quotes", (ref) =>
        ref.orderBy("quoteNo", "desc").limit(1)
      ) // Query for the last invoice
      .get()
      .subscribe((querySnapshot) => {
        let newQuoteNo = 100001; // Default value in case no invoice exists
        querySnapshot.forEach((doc) => {
          const lastQuote = doc.data() as Quote; // Cast the document data to the Invoice model
          newQuoteNo = lastQuote.quoteNo + 1; // Increment the highest invoiceNo
        });
        this.form.get("quoteNo").setValue(newQuoteNo); // Set the new invoice number
      });
  }

  get products() {
    return this.form.get("products") as FormArray;
  }

  calculateVAT(product: FormGroup): number {
    const qty = product.get("qty")?.value || 0;
    const unitPrice = product.get("unitPrice")?.value || 0;
    const tax = product.get("tax")?.value || 0; // tax is the VAT percentage

    const totalPrice = qty * unitPrice; // Total price including VAT

    // Calculate VAT amount based on price that includes VAT
    const vat = (totalPrice * tax) / (100 + tax);

    return vat;
  }

  calculateTotal(product: FormGroup): number {
    const qty = product.get("qty")?.value || 0;
    const unitPrice = product.get("unitPrice")?.value || 0;

    const total = qty * unitPrice;
    return total;
  }

  // Method to create a new product form group
  createProduct(): FormGroup {
    return this.fb.group({
      qty: ["", Validators.required],
      item: [""],
      description: ["", Validators.required],
      unitPrice: ["", [Validators.required, Validators.min(0)]],
      tax: ["", [Validators.required]],
    });
  }

  // Add a new product row to the products array
  addProduct() {
    this.products.push(this.createProduct());
  }

  // Remove a product from the products array
  removeProduct(index: number) {
    console.log("Removing product at index:", index);
    console.log(
      "Before:",
      this.products.controls.map((c) => c.value)
    );

    this.products.removeAt(index);


  }

  quoteNoExistsValidator(): (
    control: AbstractControl
  ) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.firestore
        .collection("quotes", (ref) =>
          ref.where("quoteNo", "==", control.value)
        )
        .snapshotChanges()
        .pipe(
          first(), // Make sure the observable completes after the first value is emitted
          map((quotes) => {
            const exists = quotes.length > 0;
            console.log("exists", exists); // Log the result for debugging

            // Return the error object if duplicate exists, otherwise return null
            return exists ? { quoteNoExists: true } : null;
          }),
          catchError(() => of(null)) // Handle errors in case Firestore fails
        );
    };
  }

  checkQuoteNo(quoteNo: number) {
    this.firestore
      .collection("quotes", (ref) => ref.where("quoteNo", "==", quoteNo))
      .snapshotChanges()
      .subscribe((quotes) => {
        this.quoteNoExists = quotes.length > 0;
        console.log(this.quoteNoExists);
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

  saveAsDraft() {
    this.form.get("status").setValue("draft");

    const quoteDateControl = this.form.get("quoteDate");

    // Check if quoteDate is a Moment object, and convert it to a JavaScript Date object
    if (
      quoteDateControl.value &&
      typeof quoteDateControl.value.toDate === "function"
    ) {
      quoteDateControl.setValue(quoteDateControl.value.toDate()); // Convert Moment to Date
    }

    // Set to today's date if no custom date has been set
    if (!quoteDateControl.value) {
      quoteDateControl.setValue(new Date()); // Default to today's date
    }

    // Extract the form data, including the correct date format
    const draftQuoteData = this.form.value;

    this.saveQuoteToFirestore(draftQuoteData)
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

  convertToPlainObject(quote: Quote): any {
    return {
      customerName: quote.customerName ?? "", // Provide default empty string if undefined
      address1: quote.address1 ?? "",
      address2: quote.address2 ?? "",
      address3: quote.address3 ?? "",
      address4: quote.address4 ?? "",
      quoteNo: quote.quoteNo ?? "", // Ensure quote number is not undefined
      quoteDate: quote.quoteDate ?? new Date(), // Use today's date if undefined
      products: quote.products.map((p) => ({
        qty: p.qty ?? 0, // Default to 0 if undefined
        item: p.item ?? "",
        description: p.description ?? "",
        unitPrice: p.unitPrice ?? 0,
        tax: p.tax ?? 0,
        total: p.total ?? 0, // Ensure total is not undefined
        vat: p.vat ?? 0, // Ensure VAT is not undefined
      })),
      status: quote.status ?? "draft", // Default status to 'draft'
    };
  }

  saveQuoteToFirestore(quote: Quote) {
    const plainQuoteData = this.convertToPlainObject(quote);
    console.log(plainQuoteData);
    return this.firestore.collection("quotes").add(plainQuoteData);
  }

  generatePDF(action = "open", products: FormArray) {
    // Access form values once
    const quoteData = this.form.value;

    const productsArray = products.controls.map((product: FormGroup) => {
      return new Product(product.value); // Assuming Product class takes an object in its constructor
    });

    console.log("products: ", productsArray);

    const quote = new Quote({ ...quoteData, products: productsArray });

    const formattedCustomerName = quote.customerName.replace(/ /g, "_");

    // Instantiate the quote class using the form data
    console.log("quote products", quote.products);
    const dateSendingToServer = new DatePipe("en-US").transform(
      quote.quoteDate,
      "dd/MM/yyyy"
    );

    // Determine if the quote is marked as "Paid in Full"
    // Prepare the PDF definition
    const docDefinition = {
      info: {
        title: `${formattedCustomerName}_${quote.quoteNo}`,
      },
      content: [
        {
          columns: [
            {
              image: this.base64Image || null,
              width: 120,
              margin: [0, 30, 0, 10],
            },
            {
              text: "Quotation",
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
                text: "Quotation For",
                bold: true,
                fontSize: 12,
                lineHeight: 1.4,
              },
              {
                width: 300,
                text: quote.customerName + "\n" + quote.getFullAddress(),
                alignment: "left",
                lineHeight: 1.4,
              },
            ],
            {
              width: 100,
              text: "Date: \n Quotation No.:",
              margin: [0, 0, 0, 0],
              fontSize: 12,
              lineHeight: 1.4,
            },
            {
              width: 70,
              text: dateSendingToServer + "\n" + quote.quoteNo,
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
            widths: ["auto", "auto", "*", "auto", "auto", "auto", "auto"],
            body: [
              [
                { text: "Qty", style: "tableFont" },
                { text: "Item", style: "tableFont" },
                { text: "Description", style: "tableFont" },
                { text: "Unit Price", style: "tableFont" },
                { text: "Tax%", style: "tableFont" },
                { text: "VAT", style: "tableFont" },
                { text: "Total", style: "tableFont" },
              ],
              ...quote.products.map((p) => [
                p.qty ?? "-", // Default to '-' if undefined
                p.item ?? "-",
                p.description ?? "-",
                p.unitPrice?.toFixed(2) ?? "0.00",
                p.tax?.toFixed(2) ?? "0.00",
                p.vat?.toFixed(2) ?? "0.00",
                p.total?.toFixed(2) ?? "0.00",
              ]),
              [{}, {}, {}, {}, {}, {}, {}],
              [{}, {}, {}, {}, {}, {}, {}],
              [{}, {}, {}, {}, {}, {}, {}],
              [{}, {}, {}, {}, {}, {}, {}],
              [{}, {}, {}, {}, {}, {}, {}],
              [{}, {}, {}, {}, {}, {}, {}],
              [{}, {}, {}, {}, {}, {}, {}],
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
                text: "Subtotal",
                alignment: "right",
                margin: [0, 5, -180, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: `VAT`,
                alignment: "right",
                margin: [0, 5, -180, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "Total",
                alignment: "right",
                margin: [0, 5, -180, 0],
                bold: true,
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "Balance Due",
                alignment: "right",
                margin: [0, 5, -180, 0],
                bold: true,
                fontSize: 12,
                lineHeight: 1.2,
              },
            ],
            [
              {
                text: "€" + (quote?.subTotal.toFixed(2) ?? "0.00"), // Total before VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + (quote?.totalVat.toFixed(2) ?? "0.00"), // Total VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + (quote?.quoteTotal.toFixed(2) ?? "0.00"), // Total including VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + (quote?.quoteTotal.toFixed(2) ?? "0.00"), // Balance Due
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
      pdfAction.download(`${formattedCustomerName}_${quote.quoteNo}.pdf`);
    } else if (action === "print") {
      pdfAction.print();
    } else {
      pdfAction.open();
    }

    // Save to Firestore
    this.saveQuoteToFirestore(quote)
      .then(() => {
        console.log("Quote saved successfully!");
        this.router.navigate(["/quotes-list"]); // Navigate to edit page with ID
      })
      .catch((error) => {
        console.error("Error saving quote to Firestore: ", error);
      });
  }

  viewAllQuotes() {
    this.router.navigate(["/quotes-list"]); // Navigate to edit page with ID
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
      } else if (result === "edit") {
      } else if (result === true) {
        console.log("Quote deleted");
      }
    });
  }

  openPDF(quote: Quote, action: "open") {
    this.pdfService.generatePDFQuote(quote, action);
  }
}
