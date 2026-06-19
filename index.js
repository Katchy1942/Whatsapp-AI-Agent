require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Helper to safely mask secrets in logs
const maskSecret = (secret) => {
	if (!secret) return "undefined";
	if (secret.length <= 6) return "*".repeat(secret.length);
	return `${secret.slice(0, 3)}...${secret.slice(-3)} (length: ${secret.length})`;
};

// Middleware to verify environment variables are loaded and log status
const checkEnvVariables = (req, res, next) => {
	const missing = [];
	if (!VERIFY_TOKEN) missing.push("VERIFY_TOKEN");
	if (!ACCESS_TOKEN) missing.push("ACCESS_TOKEN");
	if (!PHONE_NUMBER_ID) missing.push("PHONE_NUMBER_ID");

	console.log(
		`[INFO] Webhook ${req.method} request received. Variable status:`,
	);
	console.log(` - VERIFY_TOKEN: ${maskSecret(VERIFY_TOKEN)}`);
	console.log(` - ACCESS_TOKEN: ${maskSecret(ACCESS_TOKEN)}`);
	console.log(` - PHONE_NUMBER_ID: ${maskSecret(PHONE_NUMBER_ID)}`);

	if (missing.length > 0) {
		const envKeys = Object.keys(process.env).filter((key) => {
			return (
				!key.startsWith("npm_") &&
				!key.startsWith("BASH_") &&
				!["PATH", "LS_COLORS", "SHLVL", "_", "PWD"].includes(key)
			);
		});
		console.log(
			`[DEBUG] Available environment keys in this process:`,
			envKeys,
		);

		const errMsg = `Missing environment variables: ${missing.join(", ")}`;
		console.error(`[ERROR] ${errMsg}`);
		return res.status(500).json({
			error: "Configuration Error",
			message: `${errMsg}. Please configure them in your Railway project settings.`,
			missing,
		});
	}
	next();
};

app.get("/webhook", checkEnvVariables, (req, res) => {
	const mode = req.query["hub.mode"];
	const token = req.query["hub.verify_token"];
	const challenge = req.query["hub.challenge"];

	if (mode === "subscribe" && token === VERIFY_TOKEN) {
		res.status(200).send(challenge);
	} else {
		res.sendStatus(403);
	}
});

app.post("/webhook", checkEnvVariables, (req, res) => {
	const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

	if (message) {
		const from = message.from;
		let text = "";

		if (message.type === "text") {
			text = message.text.body.toLowerCase().trim();
		} else if (message.type === "interactive") {
			const interactiveType = message.interactive?.type;
			if (interactiveType === "list_reply") {
				const listReplyId = message.interactive.list_reply.id;
				// Map interactive menu choices to their text commands
				if (listReplyId === "menu_quote") text = "quote";
				else if (listReplyId === "menu_track") text = "track";
				else if (listReplyId === "menu_hours") text = "hours";
				else if (listReplyId === "menu_agent") text = "agent";
				else text = listReplyId.toLowerCase().trim();
			} else if (interactiveType === "button_reply") {
				text = message.interactive.button_reply.id.toLowerCase().trim();
			}
		} else if (message.type === "button") {
			// Template quick replies
			text = message.button.payload.toLowerCase().trim();
		}

		if (text) {
			handleMessage(from, text).catch((err) => {
				console.error(
					"[ERROR] Unhandled error during message processing:",
					err.message,
				);
			});
		}
	}

	res.sendStatus(200);
});

const handleMessage = async (from, text) => {
	if (text === "hi" || text === "hello" || text === "hey") {
		await sendMessage(from, {
			type: "interactive",
			interactive: {
				type: "list",
				header: {
					type: "text",
					text: "Zoom Dispatch"
				},
				body: {
					text: "Welcome to Zoom Dispatch!\n\nHow can we help you today? Please select an option from the menu."
				},
				footer: {
					text: "Select an option below"
				},
				action: {
					button: "View Menu",
					sections: [
						{
							title: "Services",
							rows: [
								{
									id: "menu_quote",
									title: "Get a Quote",
									description: "Calculate your shipping estimate"
								},
								{
									id: "menu_track",
									title: "Track Shipment",
									description: "Check the status of your cargo"
								},
								{
									id: "menu_hours",
									title: "Business Hours",
									description: "Check our operational hours"
								},
								{
									id: "menu_agent",
									title: "Speak with Agent",
									description: "Connect to a human agent"
								}
							]
						}
					]
				}
			}
		});
	} else if (text === "quote") {
		await sendMessage(
			from,
			`📦 To get a quote, please provide:\n\n` +
				`1. Origin city\n` +
				`2. Destination city\n` +
				`3. Cargo weight (kg)\n` +
				`4. Cargo type (e.g. electronics, perishables)`,
		);
	} else if (text === "track") {
		await sendMessage(
			from,
			`🔍 Please send your *tracking number* and we'll look it up right away.`,
		);
	} else if (text === "hours") {
		await sendMessage(
			from,
			`🕐 We're open:\n\nMon – Fri: 8am – 6pm\nSaturday: 9am – 3pm\nSunday: Closed`,
		);
	} else if (text === "agent") {
		await sendMessage(
			from,
			`👤 Connecting you to an agent shortly. Please hold.\n\nIn the meantime you can call us on +2347044263024`,
		);
	} else {
		await sendMessage(from, {
			type: "interactive",
			interactive: {
				type: "list",
				header: {
					type: "text",
					text: "Zoom Dispatch"
				},
				body: {
					text: "Sorry, I didn't catch that. Please select one of the services from the list below to proceed."
				},
				footer: {
					text: "Select an option below"
				},
				action: {
					button: "View Menu",
					sections: [
						{
							title: "Services",
							rows: [
								{
									id: "menu_quote",
									title: "Get a Quote",
									description: "Calculate your shipping estimate"
								},
								{
									id: "menu_track",
									title: "Track Shipment",
									description: "Check the status of your cargo"
								},
								{
									id: "menu_hours",
									title: "Business Hours",
									description: "Check our operational hours"
								},
								{
									id: "menu_agent",
									title: "Speak with Agent",
									description: "Connect to a human agent"
								}
							]
						}
					]
				}
			}
		});
	}
};

const sendMessage = async (to, content) => {
	try {
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

		await axios.post(
			`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
			payload,
			{ headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } },
		);
		console.log(`[INFO] Message successfully sent to ${to}`);
	} catch (error) {
		console.error(`[ERROR] Failed to send message to ${to}:`, error.message);
		if (error.response) {
			console.error(
				"[ERROR] Meta/Facebook API Response Data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}
	}
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
