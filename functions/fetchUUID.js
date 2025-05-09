require('dotenv').config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

const brevoKey = process.env.BREVO_KEY;
// Initialize Brevo (SibApiV3Sdk) API client
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = brevoKey;  // Set your Brevo API key here

const fetchUUIDFromMessageID = async (messageId) => {


  try {

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Fetch the email details using the message ID
    const opts = {
      messageId: messageId, // Pass the message ID
    };

    const result = await apiInstance.getTransacEmailsList(opts);
    if (
      result &&
      result.transactionalEmails &&
      result.transactionalEmails.length > 0
    ) {
      const uuid = result.transactionalEmails[0].uuid;
      console.log(`UUID for message ID ${messageId} is: ${uuid}`);
      return uuid;
    } else {
      throw new Error("UUID not found for the given message ID");
    }
  } catch (error) {
    console.error("Error fetching UUID:", error);
    throw error;
  }
};

module.exports = fetchUUIDFromMessageID;
