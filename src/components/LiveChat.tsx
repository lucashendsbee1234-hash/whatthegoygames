import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, User, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface LiveChatProps {
  isAdmin: boolean;
  adminToken: string | null;
}

export const LiveChat: React.FC<LiveChatProps> = ({ isAdmin, adminToken }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('whatthegoy_nick') || `User_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(nickname);
  const [isOpen, setIsOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cross-device live sync via SSE and polling fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat/messages');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch {}
    };

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/chat/stream');

        eventSource.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (Array.isArray(data.messages)) {
              setMessages(data.messages);
            }
          } catch {}
        });

        eventSource.addEventListener('chat_message', (e: MessageEvent) => {
          try {
            const msg: ChatMessage = JSON.parse(e.data);
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg].slice(-200);
            });
          } catch {}
        });

        eventSource.addEventListener('chat_message_deleted', (e: MessageEvent) => {
          try {
            const { id } = JSON.parse(e.data);
            setMessages(prev => prev.filter(m => m.id !== id));
          } catch {}
        });

        eventSource.addEventListener('chat_cleared', () => {
          setMessages([]);
        });

        eventSource.onerror = () => {
          eventSource?.close();
        };
      } catch {}
    };

    fetchMessages();
    setupSSE();
    pollInterval = setInterval(fetchMessages, 2500);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Scroll on messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setInputText('');
    const currentSender = isAdmin ? 'Lucas (Admin)' : nickname;

    try {
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentSender,
          text: trimmed,
        }),
      });
    } catch {}
  };

  const handleDeleteMessage = async (id: string) => {
    if (!isAdmin || !adminToken) return;
    try {
      await fetch(`/api/chat/message/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearChat = async () => {
    if (!isAdmin || !adminToken) return;
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    try {
      await fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      setMessages([]);
    } catch {}
  };

  const saveNickname = () => {
    const clean = tempNick.trim().slice(0, 16) || 'User';
    setNickname(clean);
    localStorage.setItem('whatthegoy_nick', clean);
    setIsEditingNick(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 sm:w-80 flex flex-col font-mono text-xs select-none">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white border-2 border-white px-3 py-2 flex items-center justify-between cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] hover:bg-neutral-900"
      >
        <div className="flex items-center gap-2 font-bold tracking-wider">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>CHAT</span>
          {isAdmin && (
            <span className="text-[9px] bg-white text-black px-1 font-bold">ADMIN</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && isOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
              className={`text-[9px] px-1 border transition-colors ${
                confirmClear ? 'border-red-500 text-red-400 bg-red-950/40' : 'border-neutral-700 text-neutral-400 hover:text-red-400'
              }`}
              title="Clear Chat"
            >
              {confirmClear ? 'SURE?' : 'CLEAR'}
            </button>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="bg-black border-x-2 border-b-2 border-white flex flex-col h-72 shadow-[3px_3px_0px_0px_#ffffff]">
          {/* User Nick Header */}
          <div className="border-b border-neutral-800 px-3 py-1 flex items-center justify-between text-[11px] text-neutral-400">
            {isAdmin ? (
              <span className="text-white font-bold">Lucas (Admin)</span>
            ) : isEditingNick ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  value={tempNick}
                  onChange={(e) => setTempNick(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                  maxLength={16}
                  className="bg-neutral-900 text-white border border-neutral-600 px-1 py-0.5 text-xs flex-1 outline-none"
                  autoFocus
                />
                <button 
                  onClick={saveNickname}
                  className="bg-white text-black px-1.5 py-0.5 font-bold hover:bg-neutral-200"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">Nick: <strong className="text-white">{nickname}</strong></span>
                <button 
                  onClick={() => { setTempNick(nickname); setIsEditingNick(true); }}
                  className="text-neutral-400 hover:text-white underline text-[10px]"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 select-text">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                No messages yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isMsgAdmin = msg.sender.includes('(Admin)') || msg.sender === 'Lucashendsbee';
                return (
                  <div key={msg.id} className="flex items-start justify-between group gap-1 text-[11px] leading-snug">
                    <div className="break-words flex-1">
                      <span className={`font-bold mr-1 ${isMsgAdmin ? 'text-white underline' : 'text-neutral-300'}`}>
                        {msg.sender}:
                      </span>
                      <span className="text-neutral-100">{msg.text}</span>
                    </div>

                    {/* Admin Moderation Button */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-40 group-hover:opacity-100 text-neutral-500 hover:text-red-400 shrink-0 p-0.5"
                        title="Delete message"
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
              placeholder="Message..."
              maxLength={300}
              className="flex-1 bg-black border border-neutral-800 focus:border-white px-2 py-1 text-white placeholder-neutral-600 outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-white text-black px-2.5 py-1 font-bold text-xs hover:bg-neutral-200 disabled:opacity-30"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
