const axios = require("axios");
const { ACCESS_TOKEN, PHONE_NUMBER_ID } = require("../config");

const META_API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

/**
 * @param {string} to - recipient phone number in international format
 * @param {string|object} content - plain string for a text message, or a
 *   full WhatsApp message object
*/
const sendMessage = async (to, content) => {
	let payload = {
		messaging_product: "whatsapp",
		to,
	};

	if (typeof content === "string") {
		payload.type = "text";
		payload.text = { body: content };
	} else if (typeof content === "object") {
		payload = { ...payload, ...content };
	}

	try {
		await axios.post(META_API_URL, payload, {
			headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
		});
		console.log(`[INFO] Message sent to ${to}`);
	} catch (error) {
		console.error(`[ERROR] Failed to send message to ${to}:`, error.message);
		if (error.response) {
			console.error("[ERROR] Meta API response:", JSON.stringify(error.response.data, null, 2));
		}
	}
};

module.exports = { sendMessage };
