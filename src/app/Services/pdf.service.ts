import { Injectable } from "@angular/core";
import { Statement } from "../statements/statement.model"; // Adjust import as necessary
import { DatePipe } from "@angular/common";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Invoice, Product } from "app/invoices/invoice.model";
import { Quote } from "app/quotes/quote.model";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Injectable({
  providedIn: "root",
})
export class PDFService {
  base64Image: string;

  constructor() {
    this.convertImageToBase64();
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

  generatePDFStatement(invoice: Statement, action) {
    const fullAddress = invoice.getFullAddress();

    //image location
    const dateSendingToServer = new DatePipe("en-US").transform(
      invoice.invoiceDate,
      "dd/MM/yyyy"
    );

    const formattedCustomerName = invoice.customerName.replace(/ /g, "_");

    pdfMake.fonts = {
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      },
    };

    let docDefinition = {
      info: {
        title: `${formattedCustomerName}_${invoice.invoiceNo}`,
      },
      content: [
        {
          columns: [
            {
              image: this.base64Image,
              width: 120,
              margin: [0, 30, 0, 10],
            },
            {
              text: "Statement",
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
                text: "Statement For",
                bold: true,

                fontSize: "12",
                lineHeight: 1.4,
              },
              {
                width: 300,
                text: invoice.customerName + "\n" + fullAddress,
                alignment: "left",

                lineHeight: 1.4,
              },
            ],

            {
              width: 100,
              text: "Date: \n Statement No.:",
              margin: [0, 0, 0, 0],

              fontSize: "12",
              lineHeight: 1.4,
            },
            {
              width: 70,
              text: dateSendingToServer + "\n" + invoice.invoiceNo,

              fontSize: "12",
              lineHeight: 1.4,
            },
          ],
        },
        // {
        //   text: 'NOTE: THIS IS NOT A VAT INVOICE',
        //   bold:true,
        //   margin:[0,0,0,10],
        //   font: 'helvetica',
        //   lineHeight: 1.4
        // },
        {
          //((p.price * p.qty) - (p.qty * p.price) / 1.21).toFixed(2)
          table: {
            headerRows: 1,
            style: "tableFont",
            fontSize: 12,
            heights: 15,
            widths: ["auto", "*", "auto", "auto"],
            body: [
              [
                { text: "Date", style: "tableFont" },
                { text: "Description", style: "tableFont" },
                { text: "Amount", style: "tableFont" },
                { text: "Received", style: "tableFont" },
              ],
              ...invoice.products.map((p) => [
                new DatePipe("en-US").transform(p.date, "dd/MM/yyyy"),
                p.description,
                "€" + p.amount,
                "€" + p.received,
              ]),
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
              [{}, {}, {}, {}],
            ],
          },
          layout: {
            hLineColor: function (i, node) {
              return i === 0 || i === node.table.body.length ? "black" : "gray";
            },
            vLineColor: function (i, node) {
              return i === 0 || i === node.table.widths.length
                ? "black"
                : "gray";
            },
          },
        },
        {
          columns: [
            [
              {
                text: "Total Amount",
                alignment: "right",
                margin: [0, 5, -180, 0],

                fontSize: "12",
                lineHeight: 1.2,
              },

              {
                text: "Total Received",
                alignment: "right",
                margin: [0, 5, -180, 0],
                bold: true,

                fontSize: "12",
                lineHeight: 1.2,
              },
            ],
            [
              {
                text: "€" + invoice.getTotalAmount(),
                alignment: "right",
                margin: [0, 5, 4, 0],

                fontSize: "12",
                lineHeight: 1.2,
              },
              {
                text: "€" + invoice.getTotalReceived(),
                alignment: "right",
                margin: [0, 5, 4, 0],

                fontSize: "12",
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

    if (action === "download") {
      pdfMake
        .createPdf(docDefinition)
        .download(`${formattedCustomerName}_${invoice.invoiceNo}.pdf`);
    } else if (action === "print") {
      pdfMake.createPdf(docDefinition).print();
    } else {
      pdfMake.createPdf(docDefinition).open();
    }
  }

  generatePDFEmail(invoice: Statement, action = "open"): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullAddress = invoice.getFullAddress();

      //image location
      const dateSendingToServer = new DatePipe("en-US").transform(
        invoice.invoiceDate,
        "dd/MM/yyyy"
      );
      const tableDates = invoice.products.map((p) =>
        new DatePipe("en-US").transform(p.date, "dd/MM/yyyy")
      );

      const formattedCustomerName = invoice.customerName.replace(/ /g, "_");

      pdfMake.fonts = {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      };

      let docDefinition = {
        info: {
          title: `${formattedCustomerName}_${invoice.invoiceNo}`,
        },
        content: [
          {
            columns: [
              {
                image: this.base64Image,
                width: 120,
                margin: [0, 30, 0, 10],
              },
              {
                text: "Statement",
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
                  text: "Statement For",
                  bold: true,

                  fontSize: "12",
                  lineHeight: 1.4,
                },
                {
                  width: 300,
                  text: invoice.customerName + "\n" + fullAddress,
                  alignment: "left",

                  lineHeight: 1.4,
                },
              ],

              {
                width: 100,
                text: "Date: \n Statement No.:",
                margin: [0, 0, 0, 0],

                fontSize: "12",
                lineHeight: 1.4,
              },
              {
                width: 70,
                text: dateSendingToServer + "\n" + invoice.invoiceNo,

                fontSize: "12",
                lineHeight: 1.4,
              },
            ],
          },
          // {
          //   text: 'NOTE: THIS IS NOT A VAT INVOICE',
          //   bold:true,
          //   margin:[0,0,0,10],
          //   font: 'helvetica',
          //   lineHeight: 1.4
          // },
          {
            //((p.price * p.qty) - (p.qty * p.price) / 1.21).toFixed(2)
            table: {
              headerRows: 1,
              style: "tableFont",
              fontSize: 12,
              heights: 15,
              widths: ["auto", "*", "auto", "auto"],
              body: [
                [
                  { text: "Date", style: "tableFont" },
                  { text: "Description", style: "tableFont" },
                  { text: "Amount", style: "tableFont" },
                  { text: "Received", style: "tableFont" },
                ],
                ...invoice.products.map((p) => [
                  new DatePipe("en-US").transform(p.date, "dd/MM/yyyy"),
                  p.description,
                  "€" + p.amount,
                  "€" + p.received,
                ]),
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
                [{}, {}, {}, {}],
              ],
            },
            layout: {
              hLineColor: function (i, node) {
                return i === 0 || i === node.table.body.length
                  ? "black"
                  : "gray";
              },
              vLineColor: function (i, node) {
                return i === 0 || i === node.table.widths.length
                  ? "black"
                  : "gray";
              },
            },
          },
          {
            columns: [
              [
                {
                  text: "Total Amount",
                  alignment: "right",
                  margin: [0, 5, -180, 0],

                  fontSize: "12",
                  lineHeight: 1.2,
                },

                {
                  text: "Total Received",
                  alignment: "right",
                  margin: [0, 5, -180, 0],
                  bold: true,

                  fontSize: "12",
                  lineHeight: 1.2,
                },
              ],
              [
                {
                  text:
                    "€" +
                    invoice.products
                      .reduce((total, p) => total + p.amount, 0)
                      .toFixed(2),
                  alignment: "right",
                  margin: [0, 5, 4, 0],

                  fontSize: "12",
                  lineHeight: 1.2,
                },
                {
                  text: "€" + "0",
                  alignment: "right",
                  margin: [0, 5, 4, 0],

                  fontSize: "12",
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

      pdfMake.createPdf(docDefinition).getBase64((base64Data: string) => {
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject("Failed to generate PDF");
        }
      });
    });
  }

  generatePDFInvoice(invoiceData: Invoice, action) {
    // Access form values once
    const products = invoiceData.products.map((p) => new Product(p));

    // Re-create the proper Invoice instance with the newly created products
    const invoice = new Invoice({ ...invoiceData, products });

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
                text: "€" + invoice?.subTotal?.toFixed(2) ?? "0.00", // Total before VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + invoice?.totalVat?.toFixed(2) ?? "0.00", // Total VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + invoice?.invoiceTotal?.toFixed(2) ?? "0.00", // Total including VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + invoice?.invoiceTotal?.toFixed(2) ?? "0.00", // Balance Due
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

    const isElectron = window && 'electronAPI' in window;

  if (isElectron) {
    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      const reader = new FileReader();
      reader.onload = function () {
        const buffer = Buffer.from(this.result as ArrayBuffer);
        window.electronAPI.saveAndOpenPDF(
          buffer,
          `${formattedCustomerName}_${invoice.invoiceNo}.pdf`
        );
      };
      reader.readAsArrayBuffer(blob);
    });
  } else {
    const pdfAction = pdfMake.createPdf(docDefinition);
    if (action === "download") {
      pdfAction.download(`${formattedCustomerName}_${invoice.invoiceNo}.pdf`);
    } else if (action === "print") {
      pdfAction.print();
    } else {
      pdfAction.open(); // Opens in new tab (browser only)
    }
  }
  }
  generatePDFQuoteEmail(quoteData: Quote) {
    return new Promise((resolve, reject) => {
      // Access form values once
      const products = quoteData.products.map((p) => new Product(p));

      // Re-create the proper Quote instance with the newly created products
      const quote = new Quote({ ...quoteData, products });

      const formattedCustomerName = quote.customerName.replace(/ /g, "_");

      // Instantiate the Quote class using the form data
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
              ],
              [
                {
                  text: "€" + quote?.subTotal?.toFixed(2) ?? "0.00", // Total before VAT
                  alignment: "right",
                  margin: [0, 5, 4, 0],
                  fontSize: 12,
                  lineHeight: 1.2,
                },
                {
                  text: "€" + quote?.totalVat?.toFixed(2) ?? "0.00", // Total VAT
                  alignment: "right",
                  margin: [0, 5, 4, 0],
                  fontSize: 12,
                  lineHeight: 1.2,
                },
                {
                  text: "€" + quote?.quoteTotal?.toFixed(2) ?? "0.00", // Total including VAT
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

      pdfMake.createPdf(docDefinition).getBase64((base64Data: string) => {
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject("Failed to generate PDF");
        }
      });
    });
  }
  generatePDFQuote(quoteData: Quote, action) {
    // Access form values once
    const products = quoteData.products.map((p) => new Product(p));

    // Re-create the proper Quote instance with the newly created products
    const quote = new Quote({ ...quoteData, products });

    const formattedCustomerName = quote.customerName.replace(/ /g, "_");

    // Instantiate the Quote class using the form data
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
            ],
            [
              {
                text: "€" + quote?.subTotal?.toFixed(2) ?? "0.00", // Total before VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + quote?.totalVat?.toFixed(2) ?? "0.00", // Total VAT
                alignment: "right",
                margin: [0, 5, 4, 0],
                fontSize: 12,
                lineHeight: 1.2,
              },
              {
                text: "€" + quote?.quoteTotal?.toFixed(2) ?? "0.00", // Total including VAT
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
  }
  generatePDFInvoiceEmail(invoiceData: Invoice) {
    return new Promise((resolve, reject) => {
      // Access form values once
      const products = invoiceData.products.map((p) => new Product(p));

      // Re-create the proper Invoice instance with the newly created products
      const invoice = new Invoice({ ...invoiceData, products });

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
                  text: "€" + invoice?.subTotal?.toFixed(2) ?? "0.00", // Total before VAT
                  alignment: "right",
                  margin: [0, 5, 4, 0],
                  fontSize: 12,
                  lineHeight: 1.2,
                },
                {
                  text: "€" + invoice?.totalVat?.toFixed(2) ?? "0.00", // Total VAT
                  alignment: "right",
                  margin: [0, 5, 4, 0],
                  fontSize: 12,
                  lineHeight: 1.2,
                },
                {
                  text: "€" + invoice?.invoiceTotal?.toFixed(2) ?? "0.00", // Total including VAT
                  alignment: "right",
                  margin: [0, 5, 4, 0],
                  fontSize: 12,
                  lineHeight: 1.2,
                },
                {
                  text: "€" + invoice?.invoiceTotal?.toFixed(2) ?? "0.00", // Balance Due
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

      pdfMake.createPdf(docDefinition).getBase64((base64Data: string) => {
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject("Failed to generate PDF");
        }
      });
    });
  }
}
