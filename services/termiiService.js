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
    console.log( {
        to,
        from: process.env.TERMII_SENDER_ID,
        apiKey: process.env.TERMII_API_KEY ? "Loaded" : "Missing",
        message,
    } );
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

        console.log( "✅ Termii Response:", response.data );

        return response.data;
    } catch ( error ) {
        console.error( "❌ Termii Status:", error.response?.status );
        console.error( "❌ Termii Response:", error.response?.data );
        console.error( "❌ Full Error:", error.message );

        throw error;
    }
};

exports.sendSMS = sendSMS;