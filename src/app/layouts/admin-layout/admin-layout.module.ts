import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AdminLayoutRoutes } from "./admin-layout.routing";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRippleModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { InvoicesComponent } from "app/invoices/invoices.component";
import { StatementsComponent } from "app/statements/statements.component";
import { MatIconModule } from "@angular/material/icon";
import { StatementsListComponent } from "app/statements/statements-list/statements-list.component";
import { PDFService } from "app/Services/pdf.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { StatementDialogComponent } from "app/statements/statement-dialog/statement-dialog.component";
import { MatDialogModule } from "@angular/material/dialog";
import { EditStatementsComponent } from "app/statements/edit-statements/edit-statements.component";
import { EmailDialogComponent } from "app/email-dialog/email-dialog.component";
import { MatMenuModule } from "@angular/material/menu";
import { InvoiceListComponent } from "app/invoices/invoice-list/invoice-list.component";
import { EditInvoiceComponent } from "app/invoices/edit-invoice/edit-invoice.component";
import { InvoiceDialogComponent } from "app/invoices/invoice-dialog/invoice-dialog.component";
import { EmailsComponent } from "app/emails/emails.component";
import { ViewEmailDialogComponent } from "app/emails/view-email-dialog/view-email-dialog.component";
import { QuotesComponent } from "app/quotes/quotes.component";
import { QuoteDialogComponent } from "app/quotes/quote-dialog/quote-dialog.component";
import { EditQuoteComponent } from "app/quotes/edit-quote/edit-quote.component";
import { QuoteListComponent } from "app/quotes/quote-list/quote-list.component";

import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  declarations: [
    InvoicesComponent,
    InvoiceListComponent,
    EditInvoiceComponent,
    InvoiceDialogComponent,
    StatementsComponent,
    StatementsListComponent,
    StatementDialogComponent,
    EditStatementsComponent,
    EmailDialogComponent,
    EmailsComponent,
    ViewEmailDialogComponent,
    QuotesComponent,
    QuoteDialogComponent,
    EditQuoteComponent,
    QuoteListComponent,
  ],
  providers: [
    MatDatepickerModule,
    MatNativeDateModule,
    DatePipe,
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
})
export class AdminLayoutModule {}
