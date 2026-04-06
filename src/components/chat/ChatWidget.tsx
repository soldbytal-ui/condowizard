'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTIONS = [
  "What's available in King West under $800K?",
  'Best pre-construction condos for 2027?',
  'Compare condos in Downtown Core',
  'What neighborhoods should I look at?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Show lead form after 3 user messages
  useEffect(() => {
    if (messageCount >= 3 && !leadSubmitted) setShowLeadForm(true);
  }, [messageCount, leadSubmitted]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming) return;
    if (messageCount >= 20) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setMessageCount((c) => c + 1);
    setStreaming(true);

    // Add empty assistant message for streaming
    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const error = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: error.error || 'Sorry, something went wrong. Please try again.' }]);
        setStreaming(false);
        return;
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages([...newMessages, { role: 'assistant', content: accumulated }]);
              }
            } catch {}
          }
        }
      }

      if (!accumulated) {
        setMessages([...newMessages, { role: 'assistant', content: 'I apologize, but I wasn\'t able to generate a response. Please try rephrasing your question.' }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }]);
    }

    setStreaming(false);
  }, [messages, streaming, messageCount]);

  const submitLead = async () => {
    if (!leadData.name || !leadData.email) return;
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadData, source: 'chat_assistant' }),
      });
      setLeadSubmitted(true);
      setShowLeadForm(false);
    } catch {}
  };

  // Render markdown links: [text](/url) -> <a>
  const renderContent = (text: string) => {
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return (
          <Link key={i} href={match[2]} className="text-accent-blue hover:underline font-medium">
            {match[1]}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-blue text-white flex items-center justify-center shadow-lg shadow-accent-blue/25 hover:brightness-110 transition-all hover:scale-105"
          aria-label="Open chat assistant"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-[540px] flex flex-col bg-white border border-border sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="#0066FF" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary leading-none">AI Assistant</h3>
                <p className="text-[10px] text-text-muted mt-0.5">CondoWizard.ca</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-surface2 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M2 14L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-surface rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-text-muted leading-relaxed">
                    Hi! I can help you find pre-construction condos across the Greater Toronto Area. What are you looking for?
                  </p>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-full px-3 py-1.5 hover:bg-accent-blue/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-blue/10 text-text-primary rounded-br-sm'
                      : 'bg-surface text-text-muted rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
                  {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-4 bg-accent-blue/60 ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            ))}

            {/* Lead capture banner */}
            {showLeadForm && !leadSubmitted && (
              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-3 space-y-2">
                <p className="text-xs text-text-muted">
                  Want personalized help? Leave your info and our agent will reach out.
                </p>
                <input
                  type="text"
                  placeholder="Name *"
                  value={leadData.name}
                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent-blue/30 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={leadData.email}
                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent-blue/30 outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={leadData.phone}
                  onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent-blue/30 outline-none"
                />
                <button
                  onClick={submitLead}
                  disabled={!leadData.name || !leadData.email}
                  className="w-full bg-accent-blue text-white text-xs font-semibold py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-40"
                >
                  Connect Me with an Agent
                </button>
                <p className="text-[9px] text-text-muted/50">
                  CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
                </p>
              </div>
            )}

            {leadSubmitted && (
              <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 text-center">
                <p className="text-xs text-accent-green font-medium">Thanks! Our agent will reach out shortly.</p>
              </div>
            )}

            {/* Rate limit message */}
            {messageCount >= 20 && (
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted">
                  You&apos;ve reached the message limit. Submit your info above and our agent will help you further.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-border bg-surface">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={messageCount >= 20 ? 'Message limit reached' : 'Ask about Toronto pre-construction...'}
                disabled={streaming || messageCount >= 20}
                className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent-blue/30 focus:border-accent-blue/30 outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming || messageCount >= 20}
                className="w-10 h-10 rounded-xl bg-accent-blue text-white flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-30 flex-shrink-0"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
