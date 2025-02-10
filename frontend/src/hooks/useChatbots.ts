import { useState, useEffect } from 'react';
import axios from '../services/axios';
import { Chatbot } from '../types';

export const useChatbots = () => {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChatbots = async () => {
    try {
      const response = await axios.get('/chatbot'); // updated API endpoint path
      console.log('API Response:', response.data);
      // Extract chatbots array from the response
      const chatbotsData = response.data.chatbots || [];
      const validChatbots = Array.isArray(chatbotsData) ? chatbotsData.map(bot => ({
        ...bot,
        channels: Array.isArray(bot.channels) ? bot.channels : []
      })) : [];
      setChatbots(validChatbots);
    } catch (err) {
      console.error('Error fetching chatbots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chatbots');
      setChatbots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChatbot = async (id: string) => {
    try {
      await axios.delete(`/chatbot/${id}`); // updated API endpoint path
      setChatbots(prev => prev.filter(bot => bot._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chatbot');
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  return { chatbots: chatbots || [], isLoading, error, fetchChatbots, deleteChatbot };
};
