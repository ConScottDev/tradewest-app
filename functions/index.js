const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require('cors')({ origin: true });
const { sendStatementEmail } = require("./emailService"); // Import email service
const { Firestore } = require("firebase-admin/firestore");
const { fetchEmailLogs } = require("./emailLogService");
const fetchUUIDFromMessageID = require("./fetchUUID");
const fetchEmailContentByUUID = require("./fetchEmailContentByUUID");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const app = express();
app.use(cors);

// Automatically allow cross-origin requests

// Parse incoming request bodies as JSON
app.use(express.json());

// Route to send email
app.post("/send-email", async (req, res) => {
  const { email, subject, message, pdfData, customerName, statementNo, type } =
    req.body;

  try {
    await sendStatementEmail(
      email,
      subject,
      message,
      pdfData,
      customerName,
      statementNo,
      type
    );
    await db.collection("emails").add({
      email,
      subject,
      message,
      timestamp: Firestore.FieldValue.serverTimestamp(), // Corrected this line
    });
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "Error sending email", details: error.message });
  }
});

app.get("/email-logs", async (req, res) => {
  try {
    const logs = await fetchEmailLogs(); // Call the function to fetch email logs
    res.status(200).json(logs); // Return logs as JSON
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).send("Failed to fetch email logs");
  }
});

app.get("/getEmailContent", async (req, res) => {
  const { messageId } = req.query;

  try {
    // Step 1: Fetch UUID via message ID
    const uuid = await fetchUUIDFromMessageID(messageId);

    // Step 2: Fetch email content using the UUID
    const emailContent = await fetchEmailContentByUUID(uuid);

    // Respond with email content
    res.status(200).json({ success: true, data: emailContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Expose Express API as a Firebase Function
exports.api = functions.https.onRequest(app);
