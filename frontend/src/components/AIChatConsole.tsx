import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Copy, Check, Terminal, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import type { ChatMessage } from '../types';
import { sendAIChat } from '../services/api';

// Configure marked for clean, safe HTML output
marked.setOptions({
  breaks: true,
  gfm: true
});

interface AIChatConsoleProps {
  projectId?: string;
  selectedSymbol?: { label: string; file?: string; type?: string } | null;
}

export const AIChatConsole: React.FC<AIChatConsoleProps> = ({ projectId, selectedSymbol }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // When a symbol is selected from Knowledge Graph, auto-analyze it immediately
  useEffect(() => {
    if (selectedSymbol && selectedSymbol.label) {
      const sym = selectedSymbol.label;
      const symType = selectedSymbol.type || 'Symbol';
      const symFile = selectedSymbol.file || 'codebase';

      const autoQuery = `Tell me about ${sym} (${symType} in ${symFile}) and explain how it works.`;

      // Display query bubble
      setMessages([
        {
          sender: 'user',
          text: `Tell me about **${sym}** (${symType} in \`${symFile}\`)`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setInput('');
      setLoading(true);

      // Fire query with symbol context to backend
      sendAIChat(autoQuery, projectId, selectedSymbol).then((response) => {
        setMessages((prev) => [...prev, response]);
        setLoading(false);
      }).catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'Sorry, an error occurred while analyzing this symbol.',
            citations: [],
            confidence: 0,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        setLoading(false);
      });
    } else {
      setMessages([
        {
          sender: 'ai',
          text: 'Hello! I am **CodeMind AI Reasoning Assistant**.\n\nHow can I help you understand this architecture, investigate business logic, or explore features today?',
          citations: [],
          confidence: 100,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  }, [selectedSymbol]);

  // Contextual suggested prompts depending on whether a symbol was selected
  const suggestedPrompts = React.useMemo(() => {
    if (selectedSymbol && selectedSymbol.label) {
      const sym = selectedSymbol.label;
      return [
        `Explain the implementation and logic of '${sym}'`,
        `What are the dependencies and usages of '${sym}'?`,
        `How to refactor or optimize '${sym}'?`,
        `Check for bugs or edge cases in '${sym}'`
      ];
    }
    return [
      "Explain the authentication & security flow",
      "List all exposed REST API routes",
      "What database tables are accessed?",
      "Identify God classes and cyclomatic hotspots"
    ];
  }, [selectedSymbol]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await sendAIChat(textToSend, projectId, selectedSymbol);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Sorry, an error occurred while connecting to the AI Reasoning Engine.',
          citations: [],
          confidence: 0,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    try {
      return marked.parse(text) as string;
    } catch {
      return text.replace(/\n/g, '<br/>');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex flex-col space-y-4 bg-[#0A0A0A]">
      {/* Header Bar */}
      <div className="p-4 rounded-2xl flex items-center justify-between border border-neutral-800 bg-[#121212]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-neutral-900 text-neutral-200 border border-neutral-800">
            <RefreshCw className="w-5 h-5 text-neutral-200" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Context-Aware AI RAG Assistant
              {selectedSymbol && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Target: {selectedSymbol.label}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400">Grounded in Universal AST, Vector Embeddings, and Cognitive Intelligence</p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-all text-left flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-neutral-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-neutral-200" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-[#121212] text-neutral-200 border border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800/80 pb-2">
                <span className="font-bold">
                  {msg.sender === 'user' ? 'You' : 'CodeMind AI Engine'}
                </span>
                <div className="flex items-center space-x-2">
                  {msg.confidence !== undefined && msg.confidence > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {msg.confidence}% Grounded Confidence
                    </span>
                  )}
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {/* Message Content — proper markdown rendering */}
              <div
                className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1.5
                  prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                  prose-p:text-xs prose-p:leading-relaxed prose-p:text-neutral-200 prose-p:my-1.5
                  prose-strong:text-white prose-strong:font-extrabold
                  prose-code:text-cyan-300 prose-code:bg-neutral-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-mono
                  prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-pre:rounded-xl prose-pre:p-3 prose-pre:text-[11px] prose-pre:overflow-x-auto
                  prose-li:text-xs prose-li:text-neutral-200 prose-li:my-0.5
                  prose-ul:my-1.5 prose-ol:my-1.5
                  prose-table:text-[11px] prose-th:bg-neutral-900 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:font-bold prose-th:text-neutral-200 prose-th:border prose-th:border-neutral-800
                  prose-td:px-3 prose-td:py-1.5 prose-td:border prose-td:border-neutral-800 prose-td:text-neutral-300
                  prose-blockquote:border-l-2 prose-blockquote:border-cyan-500 prose-blockquote:pl-3 prose-blockquote:text-neutral-400 prose-blockquote:italic
                  prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                  prose-hr:border-neutral-800
                  select-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />

              {/* Citations Footer */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                    AST Grounded Citations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, cIdx) => {
                      const label = typeof cite === 'string' ? cite : (cite.file ? `${cite.file}:${cite.line}` : JSON.stringify(cite));
                      return (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center space-x-1"
                        >
                          <Terminal className="w-2.5 h-2.5 text-neutral-400" />
                          <span>{label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Copy Button */}
              {msg.sender === 'ai' && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleCopy(msg.text, idx)}
                    className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center space-x-1 text-[10px]"
                  >
                    {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-neutral-200" />
            </div>
            <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-200"></div>
              <span className="text-xs text-neutral-400 pl-2 font-mono">Synthesizing AST RAG response...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 rounded-2xl bg-[#121212] border border-neutral-800 flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            selectedSymbol
              ? `Ask anything about '${selectedSymbol.label}'...`
              : "Ask anything about the codebase architecture, API routes, or business logic..."
          }
          className="flex-1 bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-white transition-all disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
