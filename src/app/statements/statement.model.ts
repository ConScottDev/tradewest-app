import { Timestamp } from '@angular/fire/firestore'; // Import Firestore Timestamp
export class Product {
  date: Date;
  description: string;
  amount: number;
  received: number;

  constructor(data?: any) {
    if (data) {
      this.date = data.date;
      this.description = data.description || "";
      this.amount = data.amount || 0;
      this.received = data.received || 0;
    }
  }
}
export class Statement {
  id: string;
  customerName: string;
  invoiceNo: number;
  invoiceDate: Date;

  address1: string;
  address2: string;
  address3: string;
  address4: string;

  status?:string;

  products: Product[] = [];
  additionalDetails: string;

  // constructor() {
  //   // Initially one empty product row we will show
  //   this.products.push(new Product());
  // }
  constructor(invoice?: any) {
    if (invoice) {
      this.id = invoice.id;  // Set the ID if passed
      this.customerName = invoice.customerName;
      this.invoiceNo = invoice.invoiceNo;

      // Convert Firestore Timestamp to Date if necessary
      this.invoiceDate =
        invoice.invoiceDate instanceof Timestamp
          ? invoice.invoiceDate.toDate() // Convert Firestore Timestamp to Date
          : new Date(invoice.invoiceDate); // Fallback for Date objects

      // Set addresses if available
      this.address1 = invoice.address1 || '';
      this.address2 = invoice.address2 || '';
      this.address3 = invoice.address3 || '';
      this.address4 = invoice.address4 || '';

      // Set status and products if available
      this.status = invoice.status || 'draft';  // Default to draft if no status is provided
      this.products = invoice.products || [];
      this.additionalDetails = invoice.additionalDetails || '';
    }
  }
  getFullAddress(): string {
    return [this.address1, this.address2, this.address3, this.address4]
      .filter((line) => line) // Remove empty lines
      .join("\n");
  }

   // Method to calculate total amount
   getTotalAmount(): number {
    return this.products.reduce((total, product) => total + product.amount, 0);
  }

  getTotalReceived(): number {
    return this.products.reduce((total, product) => total + product.received, 0);
  }
}