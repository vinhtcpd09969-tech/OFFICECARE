import { useState, useEffect } from 'react';
import api from '../../../shared/api/axios';
import { useAuthStore } from '../../../shared/stores/authStore';
import { toast } from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Lấy thông tin user hiện tại từ authStore để phân biệt tài khoản khi lưu LocalStorage
  const user = useAuthStore((state) => state.user);
  const storageKey = user ? `officecare_ai_chat_${user.id}` : 'officecare_ai_chat_guest';

  // Nạp lịch sử chat tương ứng với storageKey của tài khoản đang đăng nhập
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Lỗi phân tích lịch sử chat:', e);
      }
    } else {
      // Tin nhắn chào mừng mặc định
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'model',
        content: 'Xin chào! Tôi là trợ lý y khoa ảo của trung tâm OfficeCare. Tôi có thể giúp gì cho bạn về các vấn đề đau mỏi cơ xương khớp hoặc các dịch vụ trị liệu phục hồi của phòng khám?',
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
      localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
    }
  }, [storageKey]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));

    setLoading(true);

    try {
      // Giới hạn chỉ gửi tối đa 8 tin nhắn gần nhất để tối ưu hóa tokens
      const contextHistory = updatedMessages
        .slice(-8)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await api.post('/ai/chat', {
        message: userMsg.content,
        history: contextHistory.slice(0, -1), // Lịch sử không gồm tin nhắn vừa gõ
      });

      const replyMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: response.data.reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, replyMsg];
      setMessages(finalMessages);
      localStorage.setItem(storageKey, JSON.stringify(finalMessages));
    } catch (error: any) {
      console.error('Lỗi khi kết nối AI:', error);
      const errMsg = error.response?.data?.message || 'Không thể kết nối đến máy chủ AI. Vui lòng thử lại sau.';
      toast.error(errMsg);

      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: `⚠️ Lỗi: ${errMsg}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'model',
      content: 'Xin chào! Tôi là trợ lý y khoa ảo của trung tâm OfficeCare. Tôi có thể giúp gì cho bạn về các vấn đề đau mỏi cơ xương khớp hoặc các dịch vụ trị liệu phục hồi của phòng khám?',
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
    localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
  };

  return {
    messages,
    loading,
    isOpen,
    setIsOpen,
    sendMessage,
    clearChat,
  };
}
