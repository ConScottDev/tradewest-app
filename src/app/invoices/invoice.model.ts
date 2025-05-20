import { Timestamp } from "@angular/fire/firestore"; // Import Firestore Timestamp
export class Product {
  qty: number;
  item: string;
  description: string;
  unitPrice: number;
  tax: number;

  constructor(data?: any) {
    if (data) {
      this.qty = data.qty || 0;
      this.item = data.item || "";
      this.description = data.description || "";
      this.unitPrice = data.unitPrice || 0;
      this.tax = data.tax || 0;
    }
  }

  get total(): number {
    return this.qty * this.unitPrice;
  }
  get vat(): number {
    return (this.total * this.tax) / (100 + this.tax); // Extract VAT from total
  }
}
export class Invoice {
  id: string;
  customerName: string;
  invoiceNo: number;
  invoiceDate: Date;

  address1: string;
  address2: string;
  address3: string;
  address4: string;

  status?: string;

  products: Product[] = [];
  additionalDetails: string;
  paid: boolean = false; // default to false

  constructor(invoice?: any) {
    if (invoice) {
      this.id = invoice.id; // Set the ID if passed
      this.customerName = invoice.customerName;
      this.invoiceNo = invoice.invoiceNo;

      // Convert Firestore Timestamp to Date if necessary
      this.invoiceDate =
        invoice.invoiceDate instanceof Timestamp
          ? invoice.invoiceDate.toDate() // Convert Firestore Timestamp to Date
          : new Date(invoice.invoiceDate); // Fallback for Date objects

      // Set addresses if available
      this.address1 = invoice.address1 || "";
      this.address2 = invoice.address2 || "";
      this.address3 = invoice.address3 || "";
      this.address4 = invoice.address4 || "";

      // Set status and products if available
      this.status = invoice.status || "draft"; // Default to draft if no status is provided
      this.products = invoice.products || [];
      this.additionalDetails = invoice.additionalDetails || "";
      this.paid = invoice.paid ?? false;
    }
  }
  getFullAddress(): string {
    return [this.address1, this.address2, this.address3, this.address4]
      .filter((line) => line) // Remove empty lines
      .join("\n");
  }

  // Getter to calculate the total of all product totals (before VAT)
  get invoiceTotal(): number {
    return this.products.reduce(
      (sum, product) => sum + (product.total || 0),
      0
    );
  }

  // Getter to calculate the total VAT for all products
  get totalVat(): number {
    return this.products.reduce((sum, product) => sum + (product.vat || 0), 0);
  }

  get subTotal(): number {
    return this.invoiceTotal - this.totalVat;
  }
}
