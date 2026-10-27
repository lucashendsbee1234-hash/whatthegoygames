import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, Trash2, Shield } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface LiveChatProps {
  isAdmin?: boolean;
}

export const LiveChat: React.FC<LiveChatProps> = ({ isAdmin = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [customUsername, setCustomUsername] = useState(() => {
    return localStorage.getItem('whatthegoy_nick') || `Player_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [showAdminTag, setShowAdminTag] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages from server with cache-busting and live sync
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/chat/messages?_t=${Date.now()}`), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          setIsConnected(true);
          return;
        }
      }
    } catch {}

    // Fallback: localStorage
    try {
      const raw = localStorage.getItem('wtg_chat_messages');
      if (raw) {
        setMessages(JSON.parse(raw));
      }
    } catch {}
  }, []);

  // Connect to SSE stream and periodic polling for fallback
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupChatSSE = () => {
      try {
        if (es) es.close();
        es = new EventSource(getApiUrl('/api/chat/stream'));

        es.onopen = () => setIsConnected(true);

        es.addEventListener('chat_init', (e: MessageEvent) => {
          try {
            const list = JSON.parse(e.data);
            if (Array.isArray(list)) {
              setMessages(list);
              setIsConnected(true);
            }
          } catch {}
        });

        es.addEventListener('chat_message', (e: MessageEvent) => {
          try {
            const newMsg = JSON.parse(e.data);
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg].slice(-100);
            });
            setIsConnected(true);
          } catch {}
        });

        es.addEventListener('chat_delete', (e: MessageEvent) => {
          try {
            const { id } = JSON.parse(e.data);
            setMessages((prev) => prev.filter((m) => m.id !== id));
          } catch {}
        });

        es.addEventListener('chat_cleared', () => {
          setMessages([]);
        });

        es.onerror = () => {
          setIsConnected(false);
          es?.close();
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(setupChatSSE, 4000);
        };
      } catch {
        setIsConnected(false);
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(setupChatSSE, 5000);
      }
    };

    setupChatSSE();

    // Cross-tab broadcast channel
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('wtg_chat_channel');
      channel.onmessage = (e) => {
        if (e.data?.type === 'new_message' && e.data?.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === e.data.message.id)) return prev;
            return [...prev, e.data.message].slice(-100);
          });
        } else if (e.data?.type === 'delete_message' && e.data?.id) {
          setMessages((prev) => prev.filter((m) => m.id !== e.data.id));
        } else if (e.data?.type === 'chat_cleared') {
          setMessages([]);
        }
      };
    }

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout);
      if (es) es.close();
      if (channel) channel.close();
    };
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUsernameChange = (val: string) => {
    const clean = val.slice(0, 20);
    setCustomUsername(clean);
    try {
      localStorage.setItem('whatthegoy_nick', clean);
    } catch {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText('');

    const baseNick = customUsername.trim() || 'Player';
    const finalSender = isAdmin && showAdminTag ? `${baseNick} [Admin]` : baseNick;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender: finalSender,
      text: trimmed,
      timestamp: Date.now(),
    };

    // 1. Optimistic local update
    setMessages((prev) => [...prev, optimisticMessage].slice(-100));

    // 2. Broadcast across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('wtg_chat_channel');
        channel.postMessage({ type: 'new_message', message: optimisticMessage });
        channel.close();
      } catch {}
    }

    // 3. Persist to localStorage
    try {
      const raw = localStorage.getItem('wtg_chat_messages');
      const cur = raw ? JSON.parse(raw) : [];
      localStorage.setItem('wtg_chat_messages', JSON.stringify([...cur, optimisticMessage].slice(-100)));
    } catch {}

    // 4. Send to live server
    try {
      const res = await fetch(getApiUrl('/api/chat/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: finalSender,
          text: trimmed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? data.message : m))
          );
        }
      }
    } catch {} finally {
      setIsSending(false);
    }
  };

  // Only allowed if isAdmin
  const handleDeleteMessage = async (id: string) => {
    if (!isAdmin) return;

    setMessages((prev) => prev.filter((m) => m.id !== id));

    try {
      const raw = localStorage.getItem('wtg_chat_messages');
      if (raw) {
        const msgs = JSON.parse(raw);
        localStorage.setItem('wtg_chat_messages', JSON.stringify(msgs.filter((m: any) => m.id !== id)));
      }
    } catch {}

    try {
      await fetch(getApiUrl(`/api/chat/message/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer drrtuiodrtduiivfgjxnflgk' },
      });
    } catch {}
  };

  // Only allowed if isAdmin
  const handleClearChat = async () => {
    if (!isAdmin) return;

    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);

    setMessages([]);

    try {
      localStorage.removeItem('wtg_chat_messages');
    } catch {}

    try {
      await fetch(getApiUrl('/api/chat/clear'), {
        method: 'POST',
        headers: { 'Authorization': 'Bearer drrtuiodrtduiivfgjxnflgk' },
      });
    } catch {}
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 sm:w-84 flex flex-col font-mono text-xs select-none">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white border-2 border-white px-3 py-2 flex items-center justify-between cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] hover:bg-neutral-900"
      >
        <div className="flex items-center gap-2 font-bold tracking-wider">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>CHAT</span>
          <span className="flex items-center gap-1 text-[9px] text-neutral-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
            <span>{isConnected ? 'LIVE' : 'SYNC'}</span>
          </span>
          {isAdmin && (
            <span className="text-[9px] bg-emerald-400 text-black px-1 font-bold">ADMIN</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && isOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
              className={`text-[9px] px-1 border transition-colors ${
                confirmClear ? 'border-red-500 text-red-400 bg-red-950/40' : 'border-neutral-700 text-neutral-400 hover:text-red-400'
              }`}
              title="Clear all chat messages (Admin Only)"
            >
              {confirmClear ? 'SURE?' : 'CLEAR'}
            </button>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="bg-black border-x-2 border-b-2 border-white flex flex-col h-76 shadow-[3px_3px_0px_0px_#ffffff]">
          {/* Custom Username Field */}
          <div className="border-b border-neutral-800 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] bg-neutral-950">
            <span className="text-neutral-500 text-[10px] uppercase font-bold shrink-0">User:</span>
            <input
              type="text"
              value={customUsername}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Username"
              maxLength={20}
              className="bg-black border border-neutral-800 focus:border-white px-1.5 py-0.5 text-xs text-white outline-none flex-1 font-mono"
              title="Custom username for chat"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminTag(!showAdminTag)}
                className={`text-[9px] px-1.5 py-0.5 border flex items-center gap-0.5 shrink-0 cursor-pointer ${
                  showAdminTag 
                    ? 'border-emerald-400 bg-emerald-400 text-black font-bold' 
                    : 'border-neutral-700 text-neutral-400 hover:text-white'
                }`}
                title="Toggle [Admin] badge tag on your chat messages"
              >
                <Shield className="w-2.5 h-2.5" />
                <span>TAG</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 select-text">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map((msg) => {
                const isMsgAdmin = msg.sender.includes('[Admin]');
                return (
                  <div key={msg.id} className="flex items-start justify-between group gap-1 text-[11px] leading-snug">
                    <div className="break-words flex-1">
                      <span className={`font-bold mr-1 ${isMsgAdmin ? 'text-emerald-400 font-mono font-bold' : 'text-neutral-300 font-mono'}`}>
                        {msg.sender}:
                      </span>
                      <span className="text-neutral-100">{msg.text}</span>
                    </div>

                    {/* Admin Message Delete Button */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 shrink-0 p-0.5 cursor-pointer"
                        title="Delete message (Admin Only)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-1.5 border-t border-neutral-800 bg-neutral-950 flex gap-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              maxLength={300}
              className="flex-1 bg-black border border-neutral-800 focus:border-white px-2 py-1 text-white placeholder-neutral-600 outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="bg-white text-black px-2.5 py-1 font-bold text-xs hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
