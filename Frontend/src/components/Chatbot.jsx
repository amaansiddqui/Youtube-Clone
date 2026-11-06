import { useEffect, useRef, useState } from 'react';
import { assistantAPI } from '../utils/api';
import './Chatbot.css';

const QUICK_PROMPTS = [
  'How do I find videos?',
  'What can I do on this app?'
];

function getVideoSearchQuery(text) {
  const match = text.match(/^(?:find|search for|show me|look for|recommend)\s+(?:me\s+)?(?:some\s+)?videos?\s+(?:about|on|for)\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

export default function Chatbot({ onSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const sendMessage = async (value) => {
    const text = value.trim();
    if (!text || isSending) return;

    const searchQuery = getVideoSearchQuery(text);
    const nextMessages = [...messages, { role: 'user', content: text }].slice(-20);
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const { reply } = await assistantAPI.sendMessage(nextMessages);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: reply, searchQuery }
      ].slice(-20));
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: error.message || 'Sorry, I could not respond. Please try again.' }
      ].slice(-20));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="yt-chatbot">
      {isOpen && (
        <section className="yt-chatbot-panel" aria-label="AI assistant">
          <header className="yt-chatbot-header">
            <div>
              <strong>Video assistant</strong>
              <span>Ask about finding videos or using the app</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant">
              &times;
            </button>
          </header>

          <div className="yt-chatbot-messages" ref={conversationRef} aria-live="polite">
            <div className="yt-chatbot-message assistant">
              Hi! I can help you find videos and use the app. What would you like to do?
            </div>
            {messages.map((message, index) => (
              <div className="yt-chatbot-message-group" key={`${index}-${message.role}`}>
                <div className={`yt-chatbot-message ${message.role}`}>
                  {message.content}
                </div>
                {message.searchQuery && (
                  <button
                    type="button"
                    className="yt-chatbot-search-action"
                    onClick={() => {
                      onSearch(message.searchQuery);
                      setIsOpen(false);
                    }}
                  >
                    Search YouTube for “{message.searchQuery}”
                  </button>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="yt-chatbot-prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {isSending && <div className="yt-chatbot-typing">Thinking…</div>}
          </div>

          <form className="yt-chatbot-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder="Ask anything…"
              aria-label="Message the video assistant"
              maxLength={3000}
              rows={1}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !input.trim()} aria-label="Send message">
              Send
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        className="yt-chatbot-toggle"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        <span aria-hidden="true">✦</span>
        <span>Ask AI</span>
      </button>
    </div>
  );
}
