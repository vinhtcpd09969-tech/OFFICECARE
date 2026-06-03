import { useState, useEffect } from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

interface AiAssistantProps {
  setIsChatOpen: (isOpen: boolean) => void;
}

export default function AiAssistant({ setIsChatOpen }: AiAssistantProps) {
  const [typingIndex, setTypingIndex] = useState(0);
  const typingMessages = [
    "Đang chẩn đoán vùng đau vai gáy...",
    "Đề xuất: Bài tập kéo giãn cơ thang (30 giây)...",
    "Khuyên dùng: Siêu âm trị liệu sâu kết hợp di động khớp...",
    "Đang tìm kiếm chuyên gia cột sống phù hợp..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingIndex((prev) => (prev + 1) % typingMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-xxl bg-primary/5 overflow-hidden border-y border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Chatbot Interface Mockup */}
          <div className="order-2 md:order-1 relative">
            <ScrollReveal direction="left">
              <div className="glass-card rounded-[32px] p-6 shadow-2xl relative border border-white/60 max-w-[480px] mx-auto overflow-hidden">
                {/* Header status bar */}
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 mb-4">
                  <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-inner shrink-0">
                    <Bot size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="font-jakarta font-black text-sm text-secondary">Bác sĩ AI - Office Care</p>
                    <span className="font-jakarta text-[10px] text-primary font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span> Hoạt động 24/7
                    </span>
                  </div>
                </div>

                {/* Messages panel */}
                <div className="space-y-4 h-[260px] overflow-y-auto pr-1 text-xs">
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-600 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] font-jakarta leading-relaxed font-semibold">
                      Chào bạn! Tôi có thể tư vấn nhanh về đau mỏi vai gáy hoặc cột sống của bạn. Hãy click chatbot góc dưới bên phải màn hình để thử nhé!
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] font-jakarta leading-relaxed font-semibold">
                      Tôi bị đau nhói vùng cổ gáy sau khi làm việc máy tính lâu.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-teal-50 border border-teal-100 text-slate-600 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] font-jakarta leading-relaxed font-semibold shadow-sm">
                      <div className="flex items-center gap-1 text-primary font-black mb-1">
                        <Sparkles size={12} /> Bác sĩ AI gợi ý:
                      </div>
                      Đau cơ cổ vai gáy thường do gập cổ liên tục. Hãy áp dụng động tác kéo duỗi cổ bên trong 15 giây.
                    </div>
                  </div>
                  
                  {/* Dynamic Typing Message */}
                  <div className="flex justify-start">
                    <div className="bg-[#E6FFFA]/50 border border-[#2EC4B6]/10 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] font-jakarta font-black text-primary leading-relaxed shadow-sm min-h-[50px] flex items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={typingIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3 }}
                          >
                            {typingMessages[typingIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* AI Info Text */}
          <div className="order-1 md:order-2 space-y-6">
            <ScrollReveal direction="right" delay={150}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold text-xs uppercase tracking-wider">
                🤖 Công nghệ y tế 4.0
              </div>
              <h2 className="font-jakarta text-3xl md:text-5xl font-black text-secondary leading-tight mt-4">
                Bác sĩ AI Sẵn Sàng <span className="text-primary">Tư Vấn 24/7</span>
              </h2>
              <p className="text-slate-500 font-semibold text-sm md:text-base leading-relaxed mt-4">
                Sử dụng công nghệ trí tuệ nhân tạo tiên tiến để hỗ trợ lượng giá nhanh triệu chứng đau cơ xương khớp thường gặp của dân văn phòng và đề xuất các bài tập tự phục hồi tức thì hoàn toàn miễn phí.
              </p>
              <div className="pt-4">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsChatOpen(true)}
                  className="px-8 py-3.5 bg-primary hover:bg-[#25A89C] text-white font-extrabold rounded-full text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Trò chuyện với Bác sĩ AI
                </motion.button>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
