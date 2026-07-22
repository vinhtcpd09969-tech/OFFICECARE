import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { 
  Send, 
  X, 
  Calendar, 
  Bot, 
  Smile, 
  Info, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_PROMPTS = [
  { text: '💆 Trị mỏi cổ vai gáy', query: 'Tôi bị mỏi cổ vai gáy do ngồi máy tính nhiều, trung tâm có liệu trình nào điều trị dứt điểm không?' },
  { text: '🧘 Phục hồi đau thắt lưng', query: 'Lộ trình phục hồi đau thắt lưng và cột sống tại OfficeCare kéo dài bao lâu?' },
  { text: '⚡ Dịch vụ công nghệ cao', query: 'Phòng khám có các máy móc y khoa nào hỗ trợ phục hồi khớp khớp nhanh?' },
  { text: '📅 Đặt lịch bác sĩ khám', query: 'Tôi muốn đăng ký đặt lịch hẹn khám lượng giá 1:1 với bác sĩ chuyên khoa cơ xương khớp.' }
];

export default function AIChatBubble() {
  const { messages, loading, isOpen, setIsOpen, sendMessage, clearChat } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc mở chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Show tooltip chào mừng sau 3 giây nếu chưa mở chat lần nào trong session
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('officecare_chat_tooltip_seen');
    if (!hasSeen && !isOpen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handlePromptClick = (query: string) => {
    sendMessage(query);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Tooltip chào mừng nổi */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            className="absolute bottom-20 right-2 w-72 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 text-xs flex flex-col gap-2 z-10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <p className="font-bold text-[#2EC4B6]">Trợ lý ảo OfficeCare AI</p>
              </div>
              <button 
                onClick={() => {
                  setShowTooltip(false);
                  sessionStorage.setItem('officecare_chat_tooltip_seen', 'true');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-slate-350 leading-relaxed font-medium">
              Chào bạn! Tôi có thể giải đáp ngay các thắc mắc về đau mỏi vai gáy, thoát vị đĩa đệm và hỗ trợ đặt lịch khám bác sĩ.
            </p>
            <button
              onClick={() => {
                setIsOpen(true);
                setShowTooltip(false);
                sessionStorage.setItem('officecare_chat_tooltip_seen', 'true');
              }}
              className="text-teal-400 font-bold hover:text-teal-300 transition-colors self-start flex items-center gap-1 mt-1 group"
            >
              <span>Trò chuyện ngay</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Bong bóng Chat nổi 3D Hologram Radar */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
          sessionStorage.setItem('officecare_chat_tooltip_seen', 'true');
        }}
        className="size-14 rounded-full bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white shadow-[0_8px_30px_rgb(13,148,136,0.4)] flex items-center justify-center relative border border-white/20 focus:outline-none overflow-hidden group cursor-pointer active:scale-95 transition-all"
      >
        {/* Radar wave ping effect */}
        <span className="absolute inset-0 rounded-full bg-teal-400/20 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={22} strokeWidth={2.5} />
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
              <Bot size={24} strokeWidth={2} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 2. Khung thoại Chat Glassmorphism Pro Max */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-20 right-0 w-[360px] sm:w-[420px] h-[580px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/80 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)] flex flex-col overflow-hidden"
          >
            {/* Header: Brand Gradient và trạng thái trực tuyến */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800 shadow-sm relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D9488]/10 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="size-10 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20 text-[#14B8A6] shadow-inner">
                  <Bot size={20} className="animate-pulse text-teal-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-[13px] font-bold tracking-normal flex items-center gap-1.5">
                    <span>Trợ lý Y khoa AI</span>
                    <span className="bg-[#14B8A6]/20 text-[#2EC4B6] border border-[#2EC4B6]/20 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">PRO</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Bác sĩ ảo giải đáp 24/7</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Làm mới cuộc trò chuyện"
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all duration-200 focus:outline-none cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all duration-200 focus:outline-none cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Nội dung tin nhắn cuộn mượt */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/40 dark:bg-slate-950/20 scrollbar-thin">
              {messages.map((msg) => {
                const hasBookingTag = msg.role === 'model' && (msg.suggestBooking === true || msg.content.includes('[DAT_LICH]'));
                const cleanContent = msg.content.replace('[DAT_LICH]', '').trim();
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot avatar bên cạnh tin nhắn AI */}
                    {!isUser && (
                      <div className="size-6 bg-teal-500/10 text-teal-600 rounded-lg flex items-center justify-center shrink-0 border border-teal-500/15 mb-0.5 shadow-2xs">
                        <Bot size={13} />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[78%] rounded-[20px] px-4 py-3 text-xs leading-relaxed font-normal shadow-2xs break-words transition-all
                        ${
                          isUser
                            ? 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white rounded-br-none'
                            : msg.content.startsWith('⚠️')
                            ? 'bg-rose-50 border border-rose-100 text-rose-700 rounded-bl-none font-medium'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-bl-none'
                        }`}
                    >
                      {cleanContent.split('\n').map((para, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{para}</p>
                      ))}

                      {/* Nút đặt lịch khám */}
                      {hasBookingTag && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/booking');
                          }}
                          className="mt-3.5 w-full bg-teal-50 hover:bg-[#0D9488] dark:bg-slate-700 dark:hover:bg-[#0D9488] text-[#0D9488] hover:text-white dark:text-teal-350 dark:hover:text-white border border-[#0D9488]/30 hover:border-transparent transition-all duration-300 py-2.5 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                        >
                          <Calendar size={14} />
                          <span>Đặt lịch khám &amp; trị liệu ngay</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bouncing Dots Loading Indicator */}
              {loading && (
                <div className="flex items-end gap-2.5 justify-start">
                  <div className="size-6 bg-teal-500/10 text-teal-600 rounded-lg flex items-center justify-center shrink-0 border border-teal-500/15 mb-0.5">
                    <Bot size={13} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-[20px] rounded-bl-none px-4 py-3.5 flex items-center gap-1.5 shadow-2xs">
                    <span className="size-1.5 bg-[#0D9488] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="size-1.5 bg-[#14B8A6] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="size-1.5 bg-teal-300 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Khối Gợi Ý Câu Hỏi Tiện Lợi (Chỉ hiển thị khi hội thoại trống/mới bắt đầu) */}
            {messages.length <= 1 && (
              <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left">
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <HelpCircle size={11} className="text-[#0D9488]" />
                  <span>Gợi ý câu hỏi thường gặp</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePromptClick(prompt.query)}
                      className="text-[11px] font-medium text-slate-650 hover:text-[#0D9488] bg-white hover:bg-teal-50/40 border border-slate-200/60 hover:border-teal-500/30 px-3 py-2 rounded-xl transition-all duration-200 shadow-2xs cursor-pointer text-left active:scale-97"
                    >
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Nhập Tin Nhắn Pro Max */}
            <form 
              onSubmit={handleSend} 
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 flex gap-2 items-center relative"
            >
              <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#14B8A6] focus-within:ring-4 focus-within:ring-[#14B8A6]/10 rounded-2xl px-4 py-3 flex items-center transition-all duration-200">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Hỏi về đau mỏi vai gáy, thoát vị đĩa đệm..."
                  disabled={loading}
                  className="w-full bg-transparent text-xs font-medium outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
                />
                
                {/* Visual extra elements for high-end feel */}
                <div className="flex items-center gap-1.5 ml-2 text-slate-400">
                  <Smile size={16} className="hover:text-slate-600 transition-colors cursor-pointer hidden sm:block" />
                  <span title="AI cung cấp thông tin tham khảo y học y khoa">
                    <Info size={16} className="hover:text-slate-600 transition-colors cursor-pointer hidden sm:block" />
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white size-10 rounded-2xl flex items-center justify-center shadow-md shadow-[#0D9488]/15 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all duration-200 focus:outline-none shrink-0 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
