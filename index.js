// require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

// Webhook verification
app.get("/webhook", (req, res) => {
	console.log("ENV TOKEN:", process.env.VERIFY_TOKEN);
	console.log("QUERY TOKEN:", req.query["hub.verify_token"]);

	const mode = req.query["hub.mode"];
	const token = req.query["hub.verify_token"];
	const challenge = req.query["hub.challenge"];

	if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
		res.status(200).send(challenge);
	} else {
		res.sendStatus(403);
	}
});

// Receive messages
app.post("/webhook", (req, res) => {
	const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
	if (message) {
		console.log("Message received:", message.text?.body);
	}
	res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
