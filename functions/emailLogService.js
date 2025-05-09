const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const brevoKey = process.env.BREVO_KEY;
// Initialize Brevo (SibApiV3Sdk) API client
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = brevoKey;  // Set your Brevo API key here

async function fetchEmailLogs() {
  // Initialize the Brevo API client

  // Set the API key from Firebase config
 // Assuming your API key is stored in Firebase config

 let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  // Options for the request (customize as needed)
  let opts = { 
    'limit': 50,       // Limit the number of logs
    'offset': 0,       // Pagination offset
    'days': 30,        // Logs for the past 30 days
    // Optional filters can be added here:
    // 'email': 'example@example.com',
    // 'event': 'delivered', 
    // 'tags': 'invoice',
    // 'messageId': 'messageId_example', 
    // 'templateId': 1
  };

  try {
    // Make the API call
    const data = await apiInstance.getEmailEventReport(opts);
    console.log('API called successfully. Returned data:', data);
    console.log('Email Logs: ', JSON.stringify(data, null, 2));  // Log the entire response for analysis
    return data.events;  // Return only the events part of the response
  } catch (error) {
    console.error('Error fetching email logs from Brevo:', error);
    throw error;
  }
}

module.exports = { fetchEmailLogs };
