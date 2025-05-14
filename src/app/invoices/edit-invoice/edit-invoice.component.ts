import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Invoice, Product } from "../invoice.model";
import { Timestamp } from "@angular/fire/firestore"; // Import Firestore Timestamp
import { PDFService } from "app/Services/pdf.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, first, map, Observable, of } from "rxjs";

@Component({
  selector: "app-edit-invoice",
  templateUrl: "./edit-invoice.component.html",
  styleUrl: "./edit-invoice.component.scss",
})
export class EditInvoiceComponent {
  form: FormGroup;
  invoiceId: string;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private fb: FormBuilder,
    private pdfService: PDFService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get the invoice ID from the route parameter
    this.invoiceId = this.route.snapshot.paramMap.get("id");

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
      products: this.fb.array([]), // Add form array if needed for products
      paidInFull: [false],
      status: ["final"],
    });

    // Fetch the invoice data and populate the form
    this.firestore
      .collection("invoices")
      .doc<Invoice>(this.invoiceId)
      .valueChanges()
      .subscribe((data) => {
        if (data) {
          const invoice = new Invoice({
            ...data,
            products: data.products.map((product) => new Product(product)),
          });
          // Convert Firestore Timestamp to a valid date string for the input
          const invoiceDate = invoice.invoiceDate
            ? invoice.invoiceDate instanceof Timestamp
              ? invoice.invoiceDate.toDate().toISOString().split("T")[0]
              : invoice.invoiceDate
            : "";

          // Patch the form with the invoice values
          this.form.patchValue({
            customerName: invoice.customerName,
            invoiceNo: invoice.invoiceNo,
            invoiceDate: invoiceDate, // Use the formatted invoiceDate
            address1: invoice.address1,
            address2: invoice.address2,
            address3: invoice.address3,
            address4: invoice.address4,
            status: invoice.status,
          });

          // Set async validator for invoiceNo after form is populated
          const currentInvoiceNo = invoice.invoiceNo;
          this.form
            .get("invoiceNo")
            .setAsyncValidators(
              this.invoiceNoExistsValidator(currentInvoiceNo)
            );

          // Populate the products array
          this.setProducts(invoice.products || []);
        }
      });
  }

  get products(): FormArray {
    return this.form.get("products") as FormArray;
  }

  // Helper method to create a product FormGroup
  createProduct(product: any): FormGroup {
    return this.fb.group({
      qty: [product.qty, Validators.required],
      item: [product.item],
      description: [product.description, Validators.required],
      unitPrice: [product.unitPrice, [Validators.required, Validators.min(0)]],
      tax: [product.tax, [Validators.required]],
    });
  }

  // Set products in the FormArray
  setProducts(products: any[]): void {
    const productsFormArray = this.form.get("products") as FormArray;
    productsFormArray.clear(); // Clear existing products if any

    products.forEach((product) => {
      productsFormArray.push(this.createProduct(product));
    });
  }

  invoiceNoExistsValidator(
    currentInvoiceNo?: number
  ): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // If the current invoiceNo is the same as the one in the form, return null (no validation needed)
      if (control.value === currentInvoiceNo) {
        return of(null); // No error, the invoiceNo hasn't changed
      }

      // Otherwise, check if the invoiceNo exists in Firestore
      return this.firestore
        .collection("invoices", (ref) =>
          ref.where("invoiceNo", "==", control.value)
        )
        .snapshotChanges()
        .pipe(
          first(), // Complete after the first value is emitted
          map((invoices) => {
            const exists = invoices.length > 0;
            console.log("exists", exists); // Log the result for debugging

            // Return the error object if duplicate exists, otherwise return null
            return exists ? { invoiceNoExists: true } : null;
          }),
          catchError(() => of(null)) // Handle any Firestore errors
        );
    };
  }

  // Add a new product to the FormArray
  addProduct() {
    const productsFormArray = this.form.get("products") as FormArray;
    productsFormArray.push(this.createProduct({}));
  }

  // Remove a product from the FormArray
  // removeProduct(index: number) {
  //   const productsFormArray = this.form.get("products") as FormArray;
  //   productsFormArray.removeAt(index);
  // }

removeProduct(index: number) {
  console.log('Removing product at index:', index);
  console.log('Before:', this.products.controls.map(c => c.value));

  this.products.removeAt(index);

  console.log('After:', this.products.controls.map(c => c.value));
}




  updateInvoice() {
    // Convert form value into Invoice object
    const invoice: Invoice = this.getInvoiceFromForm();

    // Convert Invoice object to plain object to store in Firestore
    const plainInvoiceData = this.convertToPlainObject(invoice);

    this.firestore
      .collection("invoices")
      .doc<Invoice>(this.invoiceId)
      .update(plainInvoiceData) // Update with plain object
      .then(() => {
        console.log("Invoice updated successfully!");
        this.snackBar.open("Invoice updated successfully!", "Close", {
          duration: 3000,
        });
        this.router.navigate(["/invoices-list"]);
      })
      .catch((error) => console.error("Error updating invoice:", error));
  }

  updateStatus() {
    if (this.form.valid) {
      // Directly update the status field in Firestore instead of using form.value
      this.firestore
        .collection("invoices")
        .doc(this.invoiceId)
        .update({ status: "final" }) // Only update the status field
        .then(() => {
          console.log("Invoice status updated to final successfully!");
          this.snackBar.open("Status updated to final!", "Close", {
            duration: 3000,
          }); // Display snackbar
          this.router.navigate(["/invoices-list"]); // Navigate back to the invoices list
        })
        .catch((error) =>
          console.error("Error updating invoice status:", error)
        );
    }
  }

  createInvoice() {
    // Convert form value into Invoice object
    const invoice: Invoice = this.getInvoiceFromForm();

    // Convert Invoice object to plain object to store in Firestore
    const plainInvoiceData = this.convertToPlainObject(invoice);


    // First update the status to "final"
     // This will update the status first

    // After status is updated, save the invoice and generate PDF
    this.firestore
      .collection("invoices")
      .doc(this.invoiceId)
      .set(plainInvoiceData) // Store as a plain object
      .then(() => {
        this.pdfService.generatePDFInvoice(invoice, "open");
        
      })
      .catch((error) => console.error("Error saving invoice:", error));

      this.updateStatus();
  }

  // Convert form data to Invoice object
  getInvoiceFromForm(): Invoice {
    const formValue = this.form.value;
    return new Invoice({
      customerName: formValue.customerName,
      invoiceNo: formValue.invoiceNo,
      invoiceDate: formValue.invoiceDate
        ? new Date(formValue.invoiceDate)
        : null,
      address1: formValue.address1,
      address2: formValue.address2,
      address3: formValue.address3,
      address4: formValue.address4,
      status: formValue.status,
      // Convert each product into a Product instance
      products: formValue.products.map(
        (product) =>
          new Product({
            qty: product.qty,
            item: product.item,
            description: product.description,
            unitPrice: product.unitPrice,
            tax: product.tax,
          })
      ),
    });
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

  convertToPlainObject(invoice: Invoice): any {
    return {
      customerName: invoice.customerName,
      address1: invoice.address1,
      address2: invoice.address2,
      address3: invoice.address3,
      address4: invoice.address4,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate : new Date(),
      // Convert Product instances to plain objects
      products: invoice.products.map((p) => ({
        qty: p.qty,
        item: p.item,
        description: p.description,
        unitPrice: p.unitPrice,
        tax: p.tax,
        total: p.total, // Use the getter for total
        vat: p.vat, // Use the getter for vat
      })),
      status: invoice.status,
    };
  }
}
