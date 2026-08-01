'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface AIAssistantProps {
  contextData: string;
}

export default function AIAssistant({ contextData }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([
    { role: 'model', content: 'Halo! Aku Delix\'s Assistant. Ada yang bisa kubantu soal uang, jadwal, atau targetmu hari ini? 😊' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', content: userText } as const];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          contextData
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages([...newMessages, { role: 'model', content: data.text }]);
      } else {
        setMessages([...newMessages, { role: 'model', content: 'Maaf, aku lagi pusing mikirin kodingan. Coba lagi ya! 😅' }]);
      }
    } catch (e) {
      setMessages([...newMessages, { role: 'model', content: 'Koneksi error nih! Coba cek internet kamu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 md:right-8 md:bottom-8 z-50 p-4 rounded-full bg-neon text-[#0B0E14] shadow-[0_0_20px_rgba(0,230,118,0.4)] hover:scale-105 active:scale-95 transition-all",
          isOpen ? "opacity-0 scale-0 pointer-events-none" : "opacity-100 scale-100"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={cn(
          "fixed inset-0 md:inset-auto md:bottom-8 md:right-8 z-50 w-full md:w-[400px] h-full md:h-[600px] bg-darkcard md:rounded-3xl border border-gray-800 shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#050608] md:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neon/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon" />
            </div>
            <div>
              <h3 className="font-bold text-gray-100 text-sm">Delix's Assistant</h3>
              <p className="text-xs text-neon flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neon animate-pulse" /> Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn("w-8 h-8 rounded-full shrink-0 flex items-center justify-center", m.role === 'user' ? "bg-accent-blue" : "bg-neon")}>
                {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#0B0E14]" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm",
                m.role === 'user' ? "bg-accent-blue text-white rounded-tr-none" : "bg-gray-800 text-gray-200 rounded-tl-none"
              )}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:rounded-lg">
                  <ReactMarkdown>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-neon">
                <Bot className="w-4 h-4 text-[#0B0E14]" />
              </div>
              <div className="p-4 rounded-2xl bg-gray-800 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-neon animate-spin" />
                <span className="text-xs text-gray-400">Sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 bg-[#050608] md:rounded-b-3xl">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tanya soal saldo, jadwal, dll..."
              className="flex-1 bg-darkcard border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-neon transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 shrink-0 bg-neon text-[#0B0E14] rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-[#00c968] transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
