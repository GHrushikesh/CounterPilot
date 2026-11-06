import React from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const sampleQueries = [
    'How many packets of Maggi do I have left?',
    'Which items are currently low on stock?',
    'What was our top-selling product today?',
    'Record purchase of 12 bottles of Fortune Sunflower Oil at ₹125 each',
  ];

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          CounterPilot AI Assistant
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Conversational shopkeeper co-pilot for Indian retail counters.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-4">
          <Bot className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core AI Assistant Engine (Coming in Phase 2)</span>
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-2">
          Run your shop through conversation, not complex software
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The conversational intelligence layer will let shopkeepers manage inventory, query sales, and draft restock orders in Hindi, Hinglish, and English without navigating complex database screens.
        </p>

        <div className="text-left bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600 space-y-3">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Example questions you will be able to ask:</span>
          </div>
          <div className="space-y-2">
            {sampleQueries.map((query, index) => (
              <div
                key={index}
                className="p-2.5 bg-white rounded border border-slate-200/80 text-[11px] text-slate-700 flex items-center gap-2"
              >
                <span className="text-emerald-600 font-mono text-[10px]">Q{index + 1}:</span>
                <span>"{query}"</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
