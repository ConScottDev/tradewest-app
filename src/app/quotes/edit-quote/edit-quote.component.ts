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
import { Timestamp } from "@angular/fire/firestore"; // Import Firestore Timestamp
import { PDFService } from "app/Services/pdf.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, first, map, Observable, of } from "rxjs";
import { Product, Quote } from "../quote.model";

@Component({
  selector: 'app-edit-quote',
  templateUrl: './edit-quote.component.html',
  styleUrl: './edit-quote.component.scss'
})
export class EditQuoteComponent {

  form: FormGroup;
  quoteId: string;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private fb: FormBuilder,
    private pdfService: PDFService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get the quote ID from the route parameter
    this.quoteId = this.route.snapshot.paramMap.get("id");

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
      products: this.fb.array([]), // Add form array if needed for products
      paidInFull: [false],
      status: ["final"],
    });

    // Fetch the quote data and populate the form
    this.firestore
      .collection("quotes")
      .doc<Quote>(this.quoteId)
      .valueChanges()
      .subscribe((data) => {
        if (data) {
          const quote = new Quote({
            ...data,
            products: data.products.map((product) => new Product(product)),
          });
          // Convert Firestore Timestamp to a valid date string for the input
          const quoteDate = quote.quoteDate
            ? quote.quoteDate instanceof Timestamp
              ? quote.quoteDate.toDate().toISOString().split("T")[0]
              : quote.quoteDate
            : "";

          // Patch the form with the quote values
          this.form.patchValue({
            customerName: quote.customerName,
            quoteNo: quote.quoteNo,
            quoteDate: quoteDate, // Use the formatted quoteDate
            address1: quote.address1,
            address2: quote.address2,
            address3: quote.address3,
            address4: quote.address4,
            status: quote.status,
          });

          // Set async validator for quoteNo after form is populated
          const currentQuoteNo = quote.quoteNo;
          this.form
            .get("quoteNo")
            .setAsyncValidators(
              this.quoteNoExistsValidator(currentQuoteNo)
            );

          // Populate the products array
          this.setProducts(quote.products || []);
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

  quoteNoExistsValidator(
    currentquoteNo?: number
  ): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // If the current quoteNo is the same as the one in the form, return null (no validation needed)
      if (control.value === currentquoteNo) {
        return of(null); // No error, the quoteNo hasn't changed
      }

      // Otherwise, check if the quoteNo exists in Firestore
      return this.firestore
        .collection("quotes", (ref) =>
          ref.where("quoteNo", "==", control.value)
        )
        .snapshotChanges()
        .pipe(
          first(), // Complete after the first value is emitted
          map((quotes) => {
            const exists = quotes.length > 0;
            console.log("exists", exists); // Log the result for debugging

            // Return the error object if duplicate exists, otherwise return null
            return exists ? { quoteNoExists: true } : null;
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
  removeProduct(index: number) {
    const productsFormArray = this.form.get("products") as FormArray;
    productsFormArray.removeAt(index);
  }

  updateQuote() {
    // Convert form value into Quote object
    const quote: Quote = this.getQuoteFromForm();

    // Convert Quote object to plain object to store in Firestore
    const plainQuoteData = this.convertToPlainObject(quote);

    this.firestore
      .collection("quotes")
      .doc<Quote>(this.quoteId)
      .update(plainQuoteData) // Update with plain object
      .then(() => {
        console.log("Quote updated successfully!");
        this.snackBar.open("Quote updated successfully!", "Close", {
          duration: 3000,
        });
        this.router.navigate(["/quotes-list"]);
      })
      .catch((error) => console.error("Error updating quote:", error));
  }

  updateStatus() {
    if (this.form.valid) {
      // Directly update the status field in Firestore instead of using form.value
      this.firestore
        .collection("quotes")
        .doc(this.quoteId)
        .update({ status: "final" }) // Only update the status field
        .then(() => {
          console.log("Quote status updated to final successfully!");
          this.snackBar.open("Status updated to final!", "Close", {
            duration: 3000,
          }); // Display snackbar
          this.router.navigate(["/quotes-list"]); // Navigate back to the invoices list
        })
        .catch((error) =>
          console.error("Error updating quote status:", error)
        );
    }
  }

  createQuote() {
    // Convert form value into Quote object
    const quote: Quote = this.getQuoteFromForm();

    // Convert Quote object to plain object to store in Firestore
    const plainQuoteData = this.convertToPlainObject(quote);


    // First update the status to "final"
     // This will update the status first

    // After status is updated, save the quote and generate PDF
    this.firestore
      .collection("quotes")
      .doc(this.quoteId)
      .set(plainQuoteData) // Store as a plain object
      .then(() => {
        this.pdfService.generatePDFQuote(quote, "open");
        
      })
      .catch((error) => console.error("Error saving quote:", error));

      this.updateStatus();
  }

  // Convert form data to Quote object
  getQuoteFromForm(): Quote {
    const formValue = this.form.value;
    return new Quote({
      customerName: formValue.customerName,
      quoteNo: formValue.quoteNo,
      quoteDate: formValue.quoteDate
        ? new Date(formValue.quoteDate)
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

  convertToPlainObject(quote: Quote): any {
    return {
      customerName: quote.customerName,
      address1: quote.address1,
      address2: quote.address2,
      address3: quote.address3,
      address4: quote.address4,
      quoteNo: quote.quoteNo,
      quoteDate: quote.quoteDate ? quote.quoteDate : new Date(),
      // Convert Product instances to plain objects
      products: quote.products.map((p) => ({
        qty: p.qty,
        item: p.item,
        description: p.description,
        unitPrice: p.unitPrice,
        tax: p.tax,
        total: p.total, // Use the getter for total
        vat: p.vat, // Use the getter for vat
      })),
      status: quote.status,
    };
  }
}
