'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';

import { postChatbotMessage, type ChatHistoryItem } from '@/services/iaService';
import type { ChatbotDerivacionResponse } from '@/services/iaService';

export interface ChatMessage extends ChatHistoryItem {
  id: string;
  createdAt: string;
}

interface UseVirtualAssistantChatResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  model: string | null;
  derivacion: ChatbotDerivacionResponse | null;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
}

function extractAxiosMessage(err: unknown): string | null {
  if (!(err instanceof AxiosError)) return null;
  const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.join(' ');
  return err.message || null;
}

function messageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function useVirtualAssistantChat(): UseVirtualAssistantChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [derivacion, setDerivacion] = useState<ChatbotDerivacionResponse | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setModel(null);
    setDerivacion(null);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: messageId('u'),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setLoading(true);

    try {
      const snapshot = [...messagesRef.current, userMessage];
      const history = snapshot.map((item) => ({ role: item.role, content: item.content }));
      const response = await postChatbotMessage({ message: trimmed, history });

      const assistantMessage: ChatMessage = {
        id: messageId('a'),
        role: 'assistant',
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setModel(response.model);
      setDerivacion(response.derivacion ?? null);
    } catch (err: unknown) {
      const msg =
        extractAxiosMessage(err) ??
        (err instanceof Error ? err.message : null) ??
        'No se pudo obtener respuesta del asistente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    model,
    derivacion,
    sendMessage,
    clearConversation,
  };
}
