import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { MessageSquare, Send, Trash2, X, Sparkles, Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatBubble() {
  const { messages, loading, isOpen, setIsOpen, sendMessage, clearChat } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-jakarta">
      {/* 1. Bong bóng Chat tròn nổi */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative border border-white/20 focus:outline-none"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageSquare size={24} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 2. Khung thoại Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[28px] shadow-[0_24px_50px_-12px_rgba(15,23,42,0.12)] flex flex-col overflow-hidden"
          >
            {/* Tiêu đề Header */}
            <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-5 py-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="size-10 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20 text-[#14B8A6]">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Trợ lý Y khoa AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Trực tuyến</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Xóa lịch sử chat"
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all focus:outline-none"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Nội dung tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const hasBookingTag = msg.role === 'model' && msg.content.includes('[DAT_LICH]');
                const cleanContent = msg.content.replace('[DAT_LICH]', '').trim();

                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[20px] px-4 py-3 text-xs leading-relaxed font-semibold shadow-sm break-words
                        ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white rounded-br-none'
                            : msg.content.startsWith('⚠️')
                            ? 'bg-red-50 border border-red-100 text-red-700 rounded-bl-none font-bold'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                        }`}
                    >
                      {cleanContent.split('\n').map((para, i) => (
                        <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{para}</p>
                      ))}

                      {/* Hiển thị nút Đặt lịch khám trực tiếp trong bong bóng chat */}
                      {hasBookingTag && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/booking');
                          }}
                          className="mt-3 w-full bg-teal-50 hover:bg-[#0D9488] text-[#0D9488] hover:text-white border border-[#0D9488]/30 hover:border-transparent transition-all py-2.5 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Calendar size={14} />
                          <span>Đặt lịch khám & trị liệu ngay</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Hiệu ứng Đang trả lời */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-[20px] rounded-bl-none px-4 py-3 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-[#0D9488]" />
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase animate-pulse">AI đang trả lời...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Ô nhập tin nhắn */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-150/70 flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về đau mỏi vai gáy, mỏi lưng..."
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-all text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white size-10 rounded-xl flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all focus:outline-none shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
