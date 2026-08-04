require("dotenv").config();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const required = { VERIFY_TOKEN, ACCESS_TOKEN, PHONE_NUMBER_ID };

const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);

module.exports = { VERIFY_TOKEN, ACCESS_TOKEN, PHONE_NUMBER_ID };
