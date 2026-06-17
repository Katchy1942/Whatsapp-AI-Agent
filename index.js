require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

// Webhook verification
app.get("/webhook", (req, res) => {
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

app.listen(3000, () => console.log("Bot running on port 3000"));
