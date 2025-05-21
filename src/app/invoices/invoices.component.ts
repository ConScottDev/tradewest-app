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
import { Invoice, Product } from "./invoice.model";
import { InvoiceDialogComponent } from "./invoice-dialog/invoice-dialog.component";

const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");

pdfMake.vfs = pdfFonts.vfs;

@Component({
  selector: "app-invoices",
  templateUrl: "./invoices.component.html",
  styleUrls: ["./invoices.component.scss"],
})
export class InvoicesComponent implements OnInit {
  invoice = new Invoice();
  invoices$: Observable<Invoice[]>;
  vat: number;
  paidInFull = "";
  paidIF = false;
  base64Image: string;
  form: FormGroup;
  invoiceNoExists: boolean = false;

  ngOnInit() {
    this.generateInvoiceNo();
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

    this.invoices$ = this.firestore
      .collection("invoices", (ref) =>
        ref.orderBy("invoiceDate", "desc").limit(6)
      )
      .snapshotChanges()
      .pipe(
        map((actions) => {
          const invoices = actions.map((a) => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return new Invoice({ id, ...data });
          });
          return invoices; // Return the array of invoices
        }),
        catchError((error) => {
          console.error("Error fetching recent invoices:", error);
          return of([]); // Return an empty array if there's an error
        })
      );
  }

  generateInvoiceNo() {
    this.firestore
      .collection<Invoice>("invoices", (ref) =>
        ref.orderBy("invoiceNo", "desc").limit(1)
      ) // Query for the last invoice
      .get()
      .subscribe((querySnapshot) => {
        let newInvoiceNo = 16160; // Default value in case no invoice exists
        querySnapshot.forEach((doc) => {
          const lastInvoice = doc.data() as Invoice; // Cast the document data to the Invoice model
          newInvoiceNo = lastInvoice.invoiceNo + 1; // Increment the highest invoiceNo
        });
        this.form.get("invoiceNo").setValue(newInvoiceNo); // Set the new invoice number
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
  console.log('Removing product at index:', index);
  console.log('Before:', this.products.controls.map(c => c.value));

  this.products.removeAt(index);

  console.log('After:', this.products.controls.map(c => c.value));
}

  invoiceNoExistsValidator(): (
    control: AbstractControl
  ) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.firestore
        .collection("invoices", (ref) =>
          ref.where("invoiceNo", "==", control.value)
        )
        .snapshotChanges()
        .pipe(
          first(), // Make sure the observable completes after the first value is emitted
          map((invoices) => {
            const exists = invoices.length > 0;
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
      .collection("invoices", (ref) => ref.where("invoiceNo", "==", invoiceNo))
      .snapshotChanges()
      .subscribe((invoices) => {
        this.invoiceNoExists = invoices.length > 0;
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

  saveAsDraft() {
    this.form.get("status").setValue("draft");

    const invoiceDateControl = this.form.get("invoiceDate");

    // Check if invoiceDate is a Moment object, and convert it to a JavaScript Date object
    if (
      invoiceDateControl.value &&
      typeof invoiceDateControl.value.toDate === "function"
    ) {
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

  convertToPlainObject(invoice: Invoice): any {
    return {
      customerName: invoice.customerName ?? "", // Provide default empty string if undefined
      address1: invoice.address1 ?? "",
      address2: invoice.address2 ?? "",
      address3: invoice.address3 ?? "",
      address4: invoice.address4 ?? "",
      invoiceNo: invoice.invoiceNo ?? "", // Ensure invoice number is not undefined
      invoiceDate: invoice.invoiceDate ?? new Date(), // Use today's date if undefined
      products: invoice.products.map((p) => ({
        qty: p.qty ?? 0, // Default to 0 if undefined
        item: p.item ?? "",
        description: p.description ?? "",
        unitPrice: p.unitPrice ?? 0,
        tax: p.tax ?? 0,
        total: p.total ?? 0, // Ensure total is not undefined
        vat: p.vat ?? 0, // Ensure VAT is not undefined
      })),
      status: invoice.status ?? "draft", // Default status to 'draft'
    };
  }

  saveInvoiceToFirestore(invoice: Invoice) {
    const plainInvoiceData = this.convertToPlainObject(invoice);
    console.log(plainInvoiceData);
    return this.firestore.collection("invoices").add(plainInvoiceData);
  }

  generatePDF(action = "open", products: FormArray) {
    // Access form values once
    const invoiceData = this.form.value;

    const productsArray = products.controls.map((product: FormGroup) => {
      return new Product(product.value); // Assuming Product class takes an object in its constructor
    });

    const invoice = new Invoice({ ...invoiceData, products: productsArray });

    const formattedCustomerName = invoice.customerName.replace(/ /g, "_");

    // Instantiate the Invoice class using the form data
    console.log("invoice products", invoice.products);
    const dateSendingToServer = new DatePipe("en-US").transform(
      invoice.invoiceDate,
      "dd/MM/yyyy"
    );

    // Determine if the invoice is marked as "Paid in Full"
    // Prepare the PDF definition
    const docDefinition = {
      info: {
        title: `${formattedCustomerName}_${invoice.invoiceNo}`,
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
              text: "Invoice",
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
                text: "Invoice For",
                bold: true,
                fontSize: 12,
                lineHeight: 1.4,
              },
              {
                width: 300,
                text: invoice.customerName + "\n" + invoice.getFullAddress(),
                alignment: "left",
                lineHeight: 1.4,
              },
            ],
            {
              width: 100,
              text: "Date: \n Invoice No.:",
              margin: [0, 0, 0, 0],
              fontSize: 12,
              lineHeight: 1.4,
            },
            {
              width: 70,
              text: dateSendingToServer + "\n" + invoice.invoiceNo,
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
              ...invoice.products.map((p) => [
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
            ],
            [
              {
                text: "€" + (invoice?.subTotal.toFixed(2) ?? "0.00"), // Total before VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + (invoice?.totalVat.toFixed(2) ?? "0.00"), // Total VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + (invoice?.invoiceTotal.toFixed(2) ?? "0.00"), // Total including VAT
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
      pdfAction.download(`${formattedCustomerName}_${invoice.invoiceNo}.pdf`);
    } else if (action === "print") {
      pdfAction.print();
    } else {
      pdfAction.open();
    }

    // Save to Firestore
    this.saveInvoiceToFirestore(invoice)
      .then(() => {
        console.log("Invoice saved successfully!");
        this.router.navigate(["/invoices-list"]); // Navigate to edit page with ID
      })
      .catch((error) => {
        console.error("Error saving invoice to Firestore: ", error);
      });
  }

  viewAllInvoices() {
    this.router.navigate(["/invoices-list"]); // Navigate to edit page with ID
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
      } else if (result === "edit") {
      } else if (result === true) {
        console.log("Invoice deleted");
      }
    });
  }

  openPDF(invoice: Invoice, action: "open") {
    this.pdfService.generatePDFInvoice(invoice, action);
  }
}
