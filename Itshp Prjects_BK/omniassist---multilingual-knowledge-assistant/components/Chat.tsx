
import React, { useRef, useEffect, useState } from 'react';
import { Message, Language, Translations } from '../types';

interface ChatProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  language: Language;
}

const Chat: React.FC<ChatProps> = ({ messages, inputValue, setInputValue, onSend, isLoading, language }) => {
  const t = Translations[language];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStealth, setIsStealth] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fdfdff] min-h-0">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-xl shadow-indigo-100">
              <i className="fas fa-robot text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.welcome}</h2>
            <p className="text-slate-500 leading-relaxed">{t.welcomeSubtitle}</p>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs ${m.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <i className={`fas ${m.role === 'user' ? 'fa-user' : 'fa-bolt'}`}></i>
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t.sourcesTitle}</p>
                      <div className="flex flex-wrap gap-2">
                        {m.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] bg-slate-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-md hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                          >
                            <i className="fas fa-link"></i>
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className={`text-[10px] mt-2 ${m.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[70%]">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-slate-700 text-white text-xs">
                <i className="fas fa-bolt animate-pulse"></i>
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-xs text-slate-400 italic">{t.learning}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent pt-10 relative z-10">
        <div className="max-w-4xl mx-auto relative group flex gap-2">
          <div className="relative flex-1">
            <input 
              type={isStealth ? "password" : "text"} 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder={t.chatPlaceholder}
              disabled={isLoading}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-12 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all disabled:opacity-50 placeholder:text-slate-400"
              autoComplete="off"
            />
            <button 
              onClick={() => setIsStealth(!isStealth)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors p-1 ${isStealth ? 'text-indigo-600' : ''}`}
              title={isStealth ? t.stealthModeOn : t.stealthModeOff}
            >
              <i className={`fas ${isStealth ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          <button 
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-indigo-100 shrink-0"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
