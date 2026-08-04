const { Router } = require("express");
const { VERIFY_TOKEN } = require("../config");
const { extractMessage, parseMessage } = require("../services/messageParser");
const { handleMessage } = require("../services/messageHandler");

const router = Router();

// meta webhook verification handshake
router.get("/webhook", (req, res) => {
	const mode = req.query["hub.mode"];
	const token = req.query["hub.verify_token"];
	const challenge = req.query["hub.challenge"];

	if (mode === "subscribe" && token === VERIFY_TOKEN) {
		res.status(200).send(challenge);
	} else {
		res.sendStatus(403);
	}
});

// incoming WhatsApp messages
router.post("/webhook", (req, res) => {
	const message = extractMessage(req.body);
	const text = parseMessage(message);

	if (text) {
		handleMessage(message.from, text).catch((err) => {
			console.error(
				"[ERROR] Unhandled error during message processing:",
				err.message,
			);
		});
	}

	res.sendStatus(200);
});

module.exports = router;
