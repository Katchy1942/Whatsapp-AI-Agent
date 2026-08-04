const { sendMessage } = require("./whatsappClient");

const buildMenuMessage = (bodyText) => ({
	type: "interactive",
	interactive: {
		type: "list",
		header: { type: "text", text: "Zoom Dispatch" },
		body: { text: bodyText },
		footer: { text: "Select an option below" },
		action: {
			button: "View Menu",
			sections: [
				{
					title: "Services",
					rows: [
						{
							id: "menu_quote",
							title: "Get a Quote",
							description: "Calculate your shipping estimate",
						},
						{
							id: "menu_track",
							title: "Track Shipment",
							description: "Check the status of your cargo",
						},
						{
							id: "menu_hours",
							title: "Business Hours",
							description: "Check our operational hours",
						},
						{
							id: "menu_agent",
							title: "Speak with Agent",
							description: "Connect to a human agent",
						},
					],
				},
			],
		},
	},
});

const GREETINGS = new Set(["hi", "hello", "hey"]);

/**
 * @param {string} from - sender's phone number
 * @param {string} text - normalised command string from messageParser
 */
const handleMessage = async (from, text) => {
	if (GREETINGS.has(text)) {
		await sendMessage(
			from,
			buildMenuMessage(
				"Welcome to Zoom Dispatch!\n\nHow can we help you today? Please select an option from the menu.",
			),
		);
		return;
	}

	switch (text) {
		case "quote":
			await sendMessage(
				from,
				"📦 To get a quote, please provide:\n\n" +
					"1. Origin city\n" +
					"2. Destination city\n" +
					"3. Cargo weight (kg)\n" +
					"4. Cargo type (e.g. electronics, perishables)",
			);
			break;

		case "track":
			await sendMessage(
				from,
				"🔍 Please send your *tracking number* and we'll look it up right away.",
			);
			break;

		case "hours":
			await sendMessage(
				from,
				"🕐 We're open:\n\nMon – Fri: 8am – 6pm\nSaturday: 9am – 3pm\nSunday: Closed",
			);
			break;

		case "agent":
			await sendMessage(
				from,
				"👤 Connecting you to an agent shortly. Please hold.\n\nIn the meantime you can call us on +2347044263024",
			);
			break;

		default:
			await sendMessage(
				from,
				buildMenuMessage(
					"Sorry, I didn't catch that. Please select one of the services from the list below to proceed.",
				),
			);
	}
};

module.exports = { handleMessage };
