import { Routes } from "@angular/router";

import { InvoicesComponent } from "app/invoices/invoices.component";
import { StatementsComponent } from "app/statements/statements.component";
import { StatementsListComponent } from "app/statements/statements-list/statements-list.component";
import { EditStatementsComponent } from "app/statements/edit-statements/edit-statements.component";
import { InvoiceListComponent } from "app/invoices/invoice-list/invoice-list.component";
import { EditInvoiceComponent } from "app/invoices/edit-invoice/edit-invoice.component";
import { EmailsComponent } from "app/emails/emails.component";

import { QuotesComponent } from "app/quotes/quotes.component";
import { QuoteListComponent } from "app/quotes/quote-list/quote-list.component";
import { EditQuoteComponent } from "app/quotes/edit-quote/edit-quote.component";

export const AdminLayoutRoutes: Routes = [
 
  { path: "invoices", component: InvoicesComponent },
  { path: "invoices-list", component: InvoiceListComponent },
  { path: "edit-invoice/:id", component: EditInvoiceComponent },

  { path: "statements", component: StatementsComponent },
  { path: "statements-list", component: StatementsListComponent },
  { path: "edit-statement/:id", component: EditStatementsComponent },

  { path: "quotes", component: QuotesComponent },
  { path: "quotes-list", component: QuoteListComponent },
  { path: "edit-quote/:id", component: EditQuoteComponent },
  
  { path: "emails", component: EmailsComponent },

];
