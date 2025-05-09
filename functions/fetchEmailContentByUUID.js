const SibApiV3Sdk = require("sib-api-v3-sdk");
require('dotenv').config();

const brevoKey = process.env.BREVO_KEY;
// Initialize Brevo (SibApiV3Sdk) API client
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = brevoKey;  // Set your Brevo API key here

const fetchEmailContentByUUID = async (uuid) => {
    // const config = functions.config();
    // const brevoApiKey = config.brevo.key;

    try {
    //   const apiInstance = new Brevo.TransactionalEmailsApi();
    //   apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey); 
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

      
      // Fetch the email content using the UUID
      const emailContent = await apiInstance.getTransacEmailContent(uuid);
      return emailContent;
    } catch (error) {
      console.error('Error fetching email content:', error);
      throw error;
    }
  };
  
  module.exports = fetchEmailContentByUUID;
  