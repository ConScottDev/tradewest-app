const BrevoApi = require("@getbrevo/brevo");
const SibApiV3Sdk = require('sib-api-v3-sdk');

const brevoKey = process.env.BREVO_KEY;
// Initialize Brevo (SibApiV3Sdk) API client
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = brevoKey;  // Set your Brevo API key here

async function sendStatementEmail(toEmail, subject, message, pdfData, customerName, statementNo, type) {

  // Set up Brevo API client with the retrieved API key
  const client = new BrevoApi.TransactionalEmailsApi();
  client.setApiKey(BrevoApi.TransactionalEmailsApiApiKeys.apiKey, brevoKey); 

  const sendSmtpEmail = {
    sender: { email: "info@tradewest.ie", name: "tradewest" }, // Ensure sender email is verified
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: `<html><body><p>${message}</p></body></html>`,
    attachment: [
      {
        content: pdfData,  // The base64 encoded PDF data
        name: `${customerName}_${type}_${statementNo}.pdf`  // Name of the file
      }
    ]
  };

  try {
    console.log("Sending email...");
    const response = await client.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    throw new Error("Failed to send email");
  }
}

module.exports = { sendStatementEmail };
