import api from '../../../api/axios';

export interface ChatHistoryEntry {
  role: 'user' | 'model';
  content: string;
}

export const sendChatMessage = (data: { message: string; history: ChatHistoryEntry[]; sessionId: string }) =>
  api.post('/ai/chat', data);
