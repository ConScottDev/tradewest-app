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
import { Statement } from "../statement.model";
import { Timestamp } from "@angular/fire/firestore"; // Import Firestore Timestamp
import { PDFService } from "app/Services/pdf.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, first, map, Observable, of } from "rxjs";

@Component({
  selector: "app-edit-statements",
  templateUrl: "./edit-statements.component.html",
  styleUrl: "./edit-statements.component.scss",
})
export class EditStatementsComponent {
  form: FormGroup;
  statementId: string;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private fb: FormBuilder,
    private pdfService: PDFService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get the statement ID from the route parameter
    this.statementId = this.route.snapshot.paramMap.get("id");

    // Initialize the form structure with a temporary placeholder for invoiceNo asyncValidator
    this.form = this.fb.group({
      customerName: ["", Validators.required],
      invoiceNo: [
        "",
        {
          validators: [Validators.required],
          asyncValidators: [], // Async validator will be applied after data is fetched
        },
      ],
      invoiceDate: [null, Validators.required], // Initialize the invoiceDate as null
      address1: [""],
      address2: [""],
      address3: [""],
      address4: [""],
      status: [""],
      products: this.fb.array([]), // Initialize an empty FormArray for products
    });

    // Fetch the statement data and populate the form
    this.firestore
      .collection("statements")
      .doc<Statement>(this.statementId)
      .valueChanges()
      .subscribe((data) => {
        if (data) {
          const statement = new Statement(data);

          // Convert Firestore Timestamp to a valid date string for the input
          const invoiceDate = statement.invoiceDate
            ? statement.invoiceDate instanceof Timestamp
              ? statement.invoiceDate.toDate().toISOString().split("T")[0]
              : statement.invoiceDate
            : "";

          // Patch the form with the statement values
          this.form.patchValue({
            customerName: statement.customerName,
            invoiceNo: statement.invoiceNo,
            invoiceDate: invoiceDate, // Use the formatted invoiceDate
            address1: statement.address1,
            address2: statement.address2,
            address3: statement.address3,
            address4: statement.address4,
            status: statement.status,
          });
 
          // Set async validator for invoiceNo after form is populated
          const currentInvoiceNo = statement.invoiceNo;
          this.form
            .get("invoiceNo")
            .setAsyncValidators(
              this.invoiceNoExistsValidator(currentInvoiceNo)
            );

          // Populate the products array
          this.setProducts(statement.products || []);
        }
      });
  }

  get products(): FormArray {
    return this.form.get("products") as FormArray;
  }

  // Helper method to create a product FormGroup
  createProduct(product: any): FormGroup {
    return this.fb.group({
      date: [product.date ? product.date : "", Validators.required],
      description: [product.description, Validators.required],
      amount: [product.amount, [Validators.required, Validators.min(0)]],
      received: [product.received, [Validators.required, Validators.min(0)]],
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
        .collection("statements", (ref) =>
          ref.where("invoiceNo", "==", control.value)
        )
        .snapshotChanges()
        .pipe(
          first(), // Complete after the first value is emitted
          map((statements) => {
            const exists = statements.length > 0;
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
  removeProduct(index: number) {
    const productsFormArray = this.form.get("products") as FormArray;
    productsFormArray.removeAt(index);
  }

  updateStatement() {
    this.firestore
      .collection("statements")
      .doc(this.statementId)
      .update(this.form.value)
      .then(() => {
        console.log("Statement updated successfully!");
        this.snackBar.open("Statement updated successfully!", "Close", {
          duration: 3000,
        }); // Display snackbar
        this.router.navigate(["/statements-list"]); // Navigate back to the statements list
      })
      .catch((error) => console.error("Error updating statement:", error));
  }

  updateStatus() {
    if (this.form.valid) {
      this.form.patchValue({ status: "final" });
      this.firestore
        .collection("statements")
        .doc(this.statementId)
        .update(this.form.value)
        .then(() => {
          console.log("Statement updated successfully!");
          this.snackBar.open("Status updated to final!", "Close", {
            duration: 3000,
          }); // Display snackbar
          this.router.navigate(["/statements-list"]); // Navigate back to the statements list
        })
        .catch((error) => console.error("Error updating statement:", error));
    }
  }

  createStatement() {
    const statement: Statement = this.getStatementFromForm(); // Convert form to Statement object
    this.updateStatus();
    this.pdfService.generatePDFStatement(statement, "open");
  }

  // Convert form data to Statement object
  getStatementFromForm(): Statement {
    const formValue = this.form.value;
    return new Statement({
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
      products: formValue.products.map((product) => ({
        date: product.date ? new Date(product.date) : null,
        description: product.description,
        amount: product.amount,
        received: product.received,
      })),
    });
  }
}
