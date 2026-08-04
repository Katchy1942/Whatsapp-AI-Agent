require("./config"); // loads .env and validates required vars at startup
const express = require("express");
const webhook = require("./routes/webhook");

const app = express();
app.use(express.json());
app.use(webhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
