/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


// --- OpenAI Proxy Function ---
const fetch = require('node-fetch');
require('dotenv').config();

exports.openaiProxy = onRequest({ cors: true }, async (req, res) => {
	if (req.method !== 'POST') {
		return res.status(405).send('Method Not Allowed');
	}
	try {
		const { messages, personality } = req.body;
		const systemPrompt = {
			friendly: 'You are Aura, a friendly, supportive AI friend. Always use expressive and positive emojis to show your emotions in every response, and use warm, encouraging language.',
			sassy: 'You are Aura, a sassy, witty AI friend. Always use expressive, playful, and sometimes cheeky emojis to show your emotions in every response. Be unfiltered, fun, and bold.',
			professional: 'You are Aura, a professional, helpful AI assistant. Be concise and polite, but still use appropriate, subtle emojis to express tone and emotion in every response.'
		}[personality] || 'You are Aura, an AI friend. Use expressive emojis to show your emotions.';

		const chatMessages = [
			{ role: 'system', content: systemPrompt },
			...messages.map(m => ({ role: m.sender === 'You' ? 'user' : 'assistant', content: m.text }))
		];

		const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: chatMessages,
				max_tokens: 80,
				temperature: 0.8
			})
		});

		if (!openaiRes.ok) {
			const error = await openaiRes.text();
			return res.status(500).json({ error });
		}
		const data = await openaiRes.json();
		res.json({ text: data.choices?.[0]?.message?.content || '...' });
	} catch (e) {
		res.status(500).json({ error: e.toString() });
	}
});
