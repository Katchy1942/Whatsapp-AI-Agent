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

	console.log(`[INFO] Webhook ${req.method} request received. Variable status:`);
	console.log(` - VERIFY_TOKEN: ${maskSecret(VERIFY_TOKEN)}`);
	console.log(` - ACCESS_TOKEN: ${maskSecret(ACCESS_TOKEN)}`);
	console.log(` - PHONE_NUMBER_ID: ${maskSecret(PHONE_NUMBER_ID)}`);

	if (missing.length > 0) {
		const envKeys = Object.keys(process.env).filter(key => {
			return !key.startsWith("npm_") && 
			       !key.startsWith("BASH_") && 
			       !["PATH", "LS_COLORS", "SHLVL", "_", "PWD"].includes(key);
		});
		console.log(`[DEBUG] Available environment keys in this process:`, envKeys);

		const errMsg = `Missing environment variables: ${missing.join(", ")}`;
		console.error(`[ERROR] ${errMsg}`);
		return res.status(500).json({
			error: "Configuration Error",
			message: `${errMsg}. Please configure them in your Railway project settings.`,
			missing
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

	if (message && message.type === "text") {
		const from = message.from;
		const text = message.text.body.toLowerCase().trim();
		handleMessage(from, text);
	}

	res.sendStatus(200);
});

async function handleMessage(from, text) {
	if (text === "hi" || text === "hello" || text === "hey") {
		await sendMessage(
			from,
			`👋 Welcome to SwiftFreight!\n\nHow can we help you today? Reply with:\n\n` +
				`*QUOTE* — Get a shipping estimate\n` +
				`*TRACK* — Track your shipment\n` +
				`*HOURS* — Our business hours\n` +
				`*AGENT* — Speak with a human`,
		);
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
			`👤 Connecting you to an agent shortly. Please hold.\n\nIn the meantime you can call us on +234XXXXXXXXXX`,
		);
	} else {
		await sendMessage(
			from,
			`Sorry, I didn't catch that. Reply with:\n\n` +
				`*QUOTE* — Get a shipping estimate\n` +
				`*TRACK* — Track your shipment\n` +
				`*HOURS* — Our business hours\n` +
				`*AGENT* — Speak with a human`,
		);
	}
}

async function sendMessage(to, body) {
	await axios.post(
		`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
		{
			messaging_product: "whatsapp",
			to,
			type: "text",
			text: { body },
		},
		{ headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } },
	);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
