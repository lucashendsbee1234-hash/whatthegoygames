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

// Global Cross-Domain Real-Time Relay (Syncs lazrhub.ink, subdomains, and mirrors instantly)
const GLOBAL_CHAT_RELAY = 'https://ntfy.sh/whatthegoy_chat_relay_9823';

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

  // Load chat messages from global relay + local storage
  const fetchMessages = useCallback(async () => {
    // 1. Try global cross-domain relay history
    try {
      const res = await fetch(`${GLOBAL_CHAT_RELAY}/json?poll=1`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n');
        const parsedMsgs: ChatMessage[] = [];

        for (const line of lines) {
          try {
            const item = JSON.parse(line);
            if (item.event === 'message' && item.message) {
              const msgData = JSON.parse(item.message);
              if (msgData.id && msgData.sender && msgData.text) {
                parsedMsgs.push(msgData);
              }
            }
          } catch {}
        }

        if (parsedMsgs.length > 0) {
          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((m) => map.set(m.id, m));
            parsedMsgs.forEach((m) => map.set(m.id, m));
            const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp).slice(-100);
            try {
              localStorage.setItem('wtg_chat_messages', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          setIsConnected(true);
          return;
        }
      }
    } catch {}

    // 2. Try relative server API if available
    try {
      const res = await fetch(getApiUrl(`/api/chat/messages?_t=${Date.now()}`), {
        cache: 'no-store',
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          setIsConnected(true);
          return;
        }
      }
    } catch {}

    // 3. Fallback: cached localStorage messages
    try {
      const raw = localStorage.getItem('wtg_chat_messages');
      if (raw) {
        setMessages(JSON.parse(raw));
      }
    } catch {}
  }, []);

  // Connect to Real-Time SSE Stream (Cross-Domain Global Relay)
  useEffect(() => {
    fetchMessages();

    let relayES: EventSource | null = null;
    let localES: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupStream = () => {
      try {
        if (relayES) relayES.close();
        relayES = new EventSource(`${GLOBAL_CHAT_RELAY}/sse`);

        relayES.onopen = () => {
          setIsConnected(true);
        };

        relayES.onmessage = (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'message' && data.message) {
              const payload = JSON.parse(data.message);

              if (payload.type === 'game_updated' && payload.filename) {
                try {
                  if (payload.title) localStorage.setItem(`wtg_title_${payload.filename}`, payload.title);
                  if (payload.imageUrl !== undefined) localStorage.setItem(`wtg_photo_${payload.filename}`, payload.imageUrl);
                } catch {}
                window.dispatchEvent(new CustomEvent('wtg_game_updated', { detail: payload }));
              } else if (payload.type === 'game_deleted' && payload.filename) {
                window.dispatchEvent(new CustomEvent('wtg_game_deleted', { detail: payload }));
              } else if (payload.type === 'admin_broadcast' && payload.text) {
                window.dispatchEvent(new CustomEvent('wtg_admin_broadcast', { detail: payload }));
              } else if (payload.type === 'delete' && payload.id) {
                setMessages((prev) => prev.filter((m) => m.id !== payload.id));
              } else if (payload.type === 'clear') {
                setMessages([]);
                try {
                  localStorage.removeItem('wtg_chat_messages');
                } catch {}
              } else if (payload.id && payload.sender && payload.text) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === payload.id)) return prev;
                  const updated = [...prev, payload].slice(-100);
                  try {
                    localStorage.setItem('wtg_chat_messages', JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              }
            }
            setIsConnected(true);
          } catch {}
        };

        relayES.onerror = () => {
          relayES?.close();
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(setupStream, 3000);
        };
      } catch {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(setupStream, 4000);
      }
    };

    setupStream();

    // Secondary local server SSE if available
    try {
      localES = new EventSource(getApiUrl('/api/chat/stream'));
      localES.addEventListener('chat_message', (e: MessageEvent) => {
        try {
          const newMsg = JSON.parse(e.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].slice(-100);
          });
          setIsConnected(true);
        } catch {}
      });
      localES.addEventListener('chat_delete', (e: MessageEvent) => {
        try {
          const { id } = JSON.parse(e.data);
          setMessages((prev) => prev.filter((m) => m.id !== id));
        } catch {}
      });
      localES.addEventListener('chat_cleared', () => setMessages([]));
    } catch {}

    // Cross-tab broadcast channel for instant multi-tab sync
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
      clearTimeout(reconnectTimeout);
      if (relayES) relayES.close();
      if (localES) localES.close();
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

    const tempId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender: finalSender,
      text: trimmed,
      timestamp: Date.now(),
    };

    // 1. Optimistic instant local update
    setMessages((prev) => {
      const updated = [...prev, optimisticMessage].slice(-100);
      try {
        localStorage.setItem('wtg_chat_messages', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Broadcast across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('wtg_chat_channel');
        channel.postMessage({ type: 'new_message', message: optimisticMessage });
        channel.close();
      } catch {}
    }

    // 3. Publish to Global Cross-Domain Relay (instantly delivers to lazrhub.ink, serviciosit.com.ar, and all subdomains)
    try {
      await fetch(GLOBAL_CHAT_RELAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticMessage),
      });
      setIsConnected(true);
    } catch {}

    // 4. Also try sending to local server backend if running
    try {
      await fetch(getApiUrl('/api/chat/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticMessage),
      });
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

    // Notify global cross-domain relay
    try {
      await fetch(GLOBAL_CHAT_RELAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete', id }),
      });
    } catch {}

    // Also delete on server if running
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

    // Notify global cross-domain relay
    try {
      await fetch(GLOBAL_CHAT_RELAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clear' }),
      });
    } catch {}

    // Also clear on server if running
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
            <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
              {isConnected ? 'LIVE' : 'SYNC'}
            </span>
          </span>
          {isAdmin && (
            <span className="text-[9px] bg-emerald-400 text-black px-1 font-bold">ADMIN</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && isOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
              className={`text-[9px] px-1 border transition-colors cursor-pointer ${
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
