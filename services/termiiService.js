const axios = require( "axios" );
require( "dotenv" ).config();
const sendSMS = async ( to, message ) => {
    try {
        const response = await axios.post(
            "https://api.ng.termii.com/api/sms/send",
            {
                to,
                from: process.env.TERMII_SENDER_ID,
                sms: message,
                type: "plain",
                channel: "generic",
                api_key: process.env.TERMII_API_KEY,
            }
        );

        return response.data;
    } catch ( error ) {
        console.error( error.response?.data || error.message );
        throw error;
    }
};

module.exports = { sendSMS };