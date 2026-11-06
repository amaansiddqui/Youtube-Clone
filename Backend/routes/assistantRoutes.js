import express from 'express';

const router = express.Router();
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 3000;

const SYSTEM_PROMPT = `You are Clip, the helpful assistant for a YouTube-style video app.
Help people discover videos, use search and category filters, navigate the app, and understand its features.
Be concise and friendly. You can only answer from the conversation; do not claim access to private account data or video transcripts.
Do not claim to have searched, watched, liked, saved, or changed anything. If asked to summarize a video's spoken content, ask for a transcript.`;

router.post('/chat', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'AI chat is not configured. Add OPENROUTER_API_KEY to Backend/.env.' });
  }

  const { messages } = req.body || {};
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some((message) =>
      !message ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) ||
    messages[messages.length - 1]?.role !== 'user'
  ) {
    return res.status(400).json({ message: 'Send up to 20 non-empty chat messages, with your message last.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'YouTube Clone Assistant'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error(`OpenRouter request failed with status ${response.status}.`);
      return res.status(502).json({ message: 'The AI service could not complete your request. Please try again.' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      console.error('OpenRouter returned an empty or invalid assistant response.');
      return res.status(502).json({ message: 'The AI service returned an empty response. Please try again.' });
    }

    return res.json({ reply: reply.trim() });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ message: 'The AI service took too long to respond. Please try again.' });
    }
    console.error('OpenRouter request failed:', error.message);
    return res.status(502).json({ message: 'Could not reach the AI service. Please try again later.' });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
