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
export class Quote {
  id: string;
  customerName: string;
  quoteNo: number;
  quoteDate: Date;

  address1: string;
  address2: string;
  address3: string;
  address4: string;

  status?: string;

  products: Product[] = [];
  additionalDetails: string;

  // constructor() {
  //   // Initially one empty product row we will show
  //   this.products.push(new Product());
  // }
  constructor(quote?: any) {
    if (quote) {
      this.id = quote.id; // Set the ID if passed
      this.customerName = quote.customerName;
      this.quoteNo = quote.quoteNo;

      // Convert Firestore Timestamp to Date if necessary
      this.quoteDate =
        quote.quoteDate instanceof Timestamp
          ? quote.quoteDate.toDate() // Convert Firestore Timestamp to Date
          : new Date(quote.quoteDate); // Fallback for Date objects

      // Set addresses if available
      this.address1 = quote.address1 || "";
      this.address2 = quote.address2 || "";
      this.address3 = quote.address3 || "";
      this.address4 = quote.address4 || "";

      // Set status and products if available
      this.status = quote.status || "draft"; // Default to draft if no status is provided
      this.products = quote.products || [];
      this.additionalDetails = quote.additionalDetails || "";
    }
  }
  getFullAddress(): string {
    return [this.address1, this.address2, this.address3, this.address4]
      .filter((line) => line) // Remove empty lines
      .join("\n");
  }

  // Getter to calculate the total of all product totals (before VAT)
  get quoteTotal(): number {
    return this.products.reduce((sum, product) => sum + (product.total || 0), 0);
  }

  // Getter to calculate the total VAT for all products
  get totalVat(): number {
    return this.products.reduce((sum, product) => sum + (product.vat || 0), 0);
  }

  get subTotal(): number {
    return this.quoteTotal - this.totalVat;
  }
}
