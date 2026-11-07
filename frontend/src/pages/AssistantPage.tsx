import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { ChatMessage, AssistantChatResponse } from '../types';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundTruth?: Record<string, any>;
}

const SUGGESTED_QUESTIONS = [
  { label: 'Low Stock Items', query: 'Which items are currently low on stock?' },
  { label: "Today's Sales", query: "What were today's total sales and revenue?" },
  { label: "Yesterday's Sales", query: "What were my sales yesterday?" },
  { label: 'Total Catalog', query: 'How many total products do I have in the shop?' },
  { label: 'Top Sellers', query: 'What are my top-selling items today?' },
  { label: 'Unsold Items', query: 'Which items have had zero sales today?' },
];

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Namaste! I am your CounterPilot retail assistant. I have direct access to your live inventory and sales records. Ask me anything about your stock levels, today\'s sales, low stock alerts, or yesterday\'s performance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(() => `conv_${Date.now()}`);
  const [activeModel, setActiveModel] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputText('');

    const userMessage: DisplayMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build history excluding welcome prompt to stay compact
      const historyPayload: ChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res: AssistantChatResponse = await apiService.sendAssistantMessage({
        message: text,
        history: historyPayload,
        conversation_id: conversationId,
      });

      const assistantMessage: DisplayMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundTruth: res.ground_truth_context,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }
      if (res.model) {
        setActiveModel(res.model);
      }
    } catch (err: any) {
      console.error('Assistant error:', err);
      const errDetail = err?.data?.message || err?.message || 'Failed to communicate with AI Assistant.';
      setErrorMessage(errDetail);

      const errorAsstMessage: DisplayMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${errDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorAsstMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    setConversationId(`conv_${Date.now()}`);
    setErrorMessage(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Namaste! I am your CounterPilot retail assistant. I have direct access to your live inventory and sales records. Ask me anything about your stock levels, today\'s sales, low stock alerts, or yesterday\'s performance.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 display-heading">
              CounterPilot AI Assistant
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-900 border border-orange-500/20 shadow-2xs">
              <Sparkles className="w-3 h-3 text-orange-600" />
              {activeModel
                ? activeModel.includes('gemini')
                  ? `Google Gemini (${activeModel})`
                  : `BharatCode (${activeModel})`
                : 'BharatCode / Gemini'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Real-time conversational queries over live Kirana inventory & sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-700 apple-glass-button px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-orange-600" />
            Live DB Grounded
          </span>
          <button
            onClick={handleResetConversation}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 apple-glass-button rounded-full active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider">
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(s.query)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1.5 apple-glass-button text-slate-700 hover:text-orange-950 rounded-full text-[11px] font-medium transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-2.5 text-rose-700 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold tracking-tight">Assistant Notice</p>
            <p className="mt-0.5 text-rose-600/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 apple-card overflow-y-auto p-4 sm:p-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-2xs ${
                    isUser
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-500/10 text-orange-900 border border-orange-500/20'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-orange-600" />}
                </div>

                <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap transition-all ${
                      isUser
                        ? 'bg-orange-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200/70 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 font-medium ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="tabular-nums">{msg.timestamp}</span>
                    {!isUser && msg.groundTruth && (
                      <span className="text-[10px] text-orange-600 font-medium flex items-center gap-0.5">
                        • verified against db
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-900 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 text-orange-600" />
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 shadow-2xs flex items-center gap-2.5">
                <div className="flex space-x-1 items-center">
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce"></span>
                </div>
                <span className="font-medium tracking-tight">Querying store metrics & consulting BharatCode...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="apple-glass-container p-2 rounded-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about inventory, low stock, today's sales, or profit... (e.g., 'What items are low on stock?')"
            className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden disabled:opacity-50"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 apple-glass-button-primary active:scale-95 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
