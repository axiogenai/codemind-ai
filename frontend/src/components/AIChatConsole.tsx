import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Copy, Check, Terminal } from 'lucide-react';
import { marked } from 'marked';
import type { ChatMessage } from '../types';
import { sendAIChat } from '../services/api';

// Configure marked with custom renderer for flawless tables, HTTP badges, and zero backtick leaks
marked.setOptions({
  breaks: true,
  gfm: true
});

marked.use({
  renderer: {
    codespan(token) {
      // Strip any raw backtick artifacts safely
      const text = token.text.replace(/^`+|`+$/g, '').trim();
      const upper = text.toUpperCase();

      // Sleek HTTP method badges using allowed neutral/accent colors
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(upper)) {
        const methodBadges: Record<string, string> = {
          GET: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
          POST: 'bg-zinc-500/10 text-zinc-800 dark:text-zinc-200 border-zinc-500/25',
          PUT: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
          PATCH: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25',
          DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
          OPTIONS: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25',
          HEAD: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25'
        };
        const badgeStyle = methodBadges[upper] || 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25';
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold tracking-wide border ${badgeStyle}">${upper}</span>`;
      }

      // Default inline code token: clean, neutral pill without pseudo backticks
      return `<code class="font-mono text-[11px] px-1.5 py-0.5 rounded-md font-medium bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08]">${text}</code>`;
    },
    table(token) {
      let header = '';
      for (const cell of token.header) {
        const align = cell.align === 'center' ? 'text-center' : cell.align === 'right' ? 'text-right' : 'text-left';
        const content = cell.tokens ? (this.parser as any).parseInline(cell.tokens) : cell.text;
        header += `<th class="px-4 py-3 ${align} font-mono font-semibold text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-300 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-white/[0.08] whitespace-nowrap select-text">${content}</th>`;
      }

      let body = '';
      for (const row of token.rows) {
        let cells = '';
        for (const cell of row) {
          const align = cell.align === 'center' ? 'text-center' : cell.align === 'right' ? 'text-right' : 'text-left';
          const content = cell.tokens ? (this.parser as any).parseInline(cell.tokens) : cell.text;
          cells += `<td class="px-4 py-2.5 ${align} text-xs text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-white/[0.04] align-middle select-text">${content}</td>`;
        }
        body += `<tr class="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">${cells}</tr>`;
      }

      return `<div class="table-container my-3.5 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111215] shadow-2xs custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-full text-xs">
          <thead><tr>${header}</tr></thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-white/[0.04]">${body}</tbody>
        </table>
      </div>`;
    }
  }
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
    <div className="h-[calc(100vh-4rem)] p-6 flex flex-col space-y-4 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Header Bar */}
      <div className="p-3.5 rounded-2xl flex items-center justify-between border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0E0F12] shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-[#151619] text-sky-600 dark:text-sky-400 border border-zinc-200 dark:border-white/[0.08] shadow-2xs">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              Context-Aware AI RAG Assistant
              {selectedSymbol && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-100 dark:bg-[#151619] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span className="text-zinc-500 font-sans text-[10px]">Target:</span>
                  <span className="text-sky-600 dark:text-sky-400">{selectedSymbol.label}</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">Grounded in Universal AST, Vector Embeddings, and Cognitive Intelligence</p>
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
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all text-left flex items-center space-x-2 cursor-pointer disabled:opacity-50 shadow-2xs hover:scale-[1.01]"
          >
            <Terminal className="w-3 h-3 text-zinc-400" />
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
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mt-1 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`rounded-2xl p-4.5 space-y-3 transition-all ${
                msg.sender === 'user'
                  ? 'max-w-xl bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700 shadow-xs'
                  : 'w-full max-w-4xl xl:max-w-5xl bg-white dark:bg-[#111215] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-white/[0.06] pb-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {msg.sender === 'user' ? 'You' : 'CodeMind AI Engine'}
                </span>
                <div className="flex items-center space-x-2">
                  {msg.confidence !== undefined && msg.confidence > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08]">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>
                        <strong className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{msg.confidence}%</strong> Grounded Confidence
                      </span>
                    </span>
                  )}
                  <span className="text-zinc-400">{msg.timestamp}</span>
                </div>
              </div>

              {/* Message Content — proper markdown and table rendering */}
              <div
                className="prose dark:prose-invert prose-sm max-w-none
                  prose-headings:text-zinc-900 dark:prose-headings:text-white prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1.5
                  prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                  prose-p:text-xs prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:my-1.5
                  prose-strong:text-zinc-900 dark:prose-strong:text-white prose-strong:font-bold
                  prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-900 dark:prose-pre:bg-[#0D0E12] prose-pre:border prose-pre:border-zinc-800 dark:prose-pre:border-white/[0.08] prose-pre:rounded-xl prose-pre:p-3.5 prose-pre:text-[11px] prose-pre:overflow-x-auto
                  prose-li:text-xs prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-li:my-0.5
                  prose-ul:my-1.5 prose-ol:my-1.5
                  prose-blockquote:border-l-2 prose-blockquote:border-zinc-400 dark:prose-blockquote:border-zinc-600 prose-blockquote:pl-3 prose-blockquote:text-zinc-500 dark:prose-blockquote:text-zinc-400 prose-blockquote:italic
                  prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline
                  prose-hr:border-zinc-200 dark:prose-hr:border-white/[0.08]
                  select-text w-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />

              {/* Citations Footer */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                    AST Grounded Citations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, cIdx) => {
                      const label = typeof cite === 'string' ? cite : (cite.file ? `${cite.file}:${cite.line}` : JSON.stringify(cite));
                      return (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] flex items-center space-x-1"
                        >
                          <Terminal className="w-2.5 h-2.5 text-zinc-400" />
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
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer flex items-center space-x-1 text-[10px]"
                  >
                    {copiedIdx === idx ? <Check className="w-3 h-3 text-teal-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-1 text-white shadow-2xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mt-1 text-zinc-700 dark:text-zinc-300 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111215] border border-zinc-200 dark:border-white/[0.08] flex items-center space-x-2 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce delay-200"></div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 pl-2 font-mono">Synthesizing AST RAG response...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-2.5 pl-4 rounded-2xl bg-white dark:bg-[#111215] border border-zinc-200 dark:border-white/[0.08] focus-within:border-zinc-400 dark:focus-within:border-white/20 shadow-xs flex items-center space-x-3 transition-colors">
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
          className="flex-1 bg-transparent border-none text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
