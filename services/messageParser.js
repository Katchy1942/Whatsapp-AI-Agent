// map interactive list reply IDs to their plain-text command equivalents
const LIST_REPLIES = {
	menu_quote: "quote",
	menu_track: "track",
	menu_hours: "hours",
	menu_agent: "agent",
};

const extractMessage = (body) =>
	body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ?? null;

/**
 * @param {object} message - a single message object from the WhatsApp payload
 * @returns {string} lowercase trimmed command string, or "" if unrecognised
*/
const parseMessage = (message) => {
	if (!message) return "";

	switch (message.type) {
		case "text":
			return message.text.body.toLowerCase().trim();

		case "interactive": {
			const interactiveType = message.interactive?.type;

			if (interactiveType === "list_reply") {
				const id = message.interactive.list_reply.id;
				return LIST_REPLIES[id] ?? id.toLowerCase().trim();
			}

			if (interactiveType === "button_reply") {
				return message.interactive.button_reply.id.toLowerCase().trim();
			}

			return "";
		}

		case "button":
			return message.button.payload.toLowerCase().trim();

		default:
			return "";
	}
};

module.exports = { extractMessage, parseMessage };
