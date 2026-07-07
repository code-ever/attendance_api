const axios = require( "axios" );
require( "dotenv" ).config();

// ===============================
// FORMAT PHONE NUMBER
// ===============================
const formatPhone = ( phone ) => {
    if ( !phone ) return null;

    // Remove spaces, dashes, brackets
    phone = phone.replace( /\s+/g, "" ).replace( /[-()]/g, "" );

    // 08012345678 -> 2348012345678
    if ( phone.startsWith( "0" ) ) {
        return "234" + phone.slice( 1 );
    }

    // +2348012345678 -> 2348012345678
    if ( phone.startsWith( "+234" ) ) {
        return phone.substring( 1 );
    }

    // Already correct
    if ( phone.startsWith( "234" ) ) {
        return phone;
    }

    return phone;
};

// ===============================
// SEND SMS
// ===============================
const sendSMS = async ( to, message ) => {
    try {
        const phone = formatPhone( to );

        console.log( "Sending SMS to:", phone );

        const payload = {
            to: phone,
            from: process.env.TERMII_SENDER_ID,
            sms: message,
            type: "plain",
            channel: "generic",
            api_key: process.env.TERMII_API_KEY,
        };

        console.log( "Payload:", payload );

        const response = await axios.post(
            "https://api.ng.termii.com/api/sms/send",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log( "Termii Response:", response.data );

        return response.data;
    } catch ( error ) {
        console.error(
            "Termii Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

module.exports = {
    sendSMS,
};