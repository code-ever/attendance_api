const axios = require("axios");
require("dotenv").config();

// ===============================
// FORMAT PHONE NUMBER
// ===============================
const formatPhone = (phone) => {
  if (!phone) return null;

  // Convert to string and remove everything except digits
  phone = String(phone).replace(/\D/g, "");

  // 07064562237 -> 2347064562237
  if (phone.startsWith("0")) {
    return "234" + phone.substring(1);
  }

  // 23407064562237 -> 2347064562237
  if (phone.startsWith("2340")) {
    return "234" + phone.substring(4);
  }

  // Already in correct format
  if (phone.startsWith("234")) {
    return phone;
  }

  // If someone enters 7064562237 (10 digits)
  if (phone.length === 10) {
    return "234" + phone;
  }

  return phone;
};

// ===============================
// SEND SMS
// ===============================
const sendSMS = async (to, message) => {
  // Format the phone number before sending
  const formattedPhone = formatPhone(to);

//   console.log({
//     originalPhone: to,
//     formattedPhone,
//     from: process.env.TERMII_SENDER_ID,
//     apiKey: process.env.TERMII_API_KEY ? "Loaded" : "Missing",
//     message,
//   });

  try {
    const response = await axios.post(
      "https://api.ng.termii.com/api/sms/send",
      {
        to: formattedPhone,
        from: process.env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
      }
    );

    console.log("✅ Termii Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Termii Status:", error.response?.status);
    console.error("❌ Termii Response:", error.response?.data);
    console.error("❌ Full Error:", error.message);

    throw error;
  }
};

module.exports = {
  sendSMS,
};