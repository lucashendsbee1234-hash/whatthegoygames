import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, ChevronDown, ChevronUp, User, Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface LiveChatProps {
  onlineCount: number;
}

export const LiveChat: React.FC<LiveChatProps> = ({ onlineCount }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('whatthegoy_nick') || `Player_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(nickname);
  const [isOpen, setIsOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Beep for new messages
  const playChatNotification = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.frequency.setValueAtTime(587.33, audioCtxRef.current.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtxRef.current.currentTime + 0.05); // A5
      gain.gain.setValueAtTime(0.04, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.08);
    } catch {}
  };

  // Connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/chat/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
          if (pollInterval) clearInterval(pollInterval);
        };

        eventSource.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (Array.isArray(data.messages)) {
              setMessages(data.messages);
            }
          } catch (err) {
            console.error('SSE init parse error:', err);
          }
        });

        eventSource.addEventListener('chat_message', (e: MessageEvent) => {
          try {
            const msg: ChatMessage = JSON.parse(e.data);
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg].slice(-250);
            });
            playChatNotification();
          } catch (err) {
            console.error('SSE chat_message parse error:', err);
          }
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Fallback to polling every 3 seconds if SSE fails
          if (!pollInterval) {
            pollInterval = setInterval(fetchMessages, 3000);
          }
        };
      } catch {
        setIsConnected(false);
        if (!pollInterval) {
          pollInterval = setInterval(fetchMessages, 3000);
        }
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat/messages');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        // silent catch
      }
    };

    // Initial fetch
    fetchMessages();
    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Auto-scroll on new messages
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

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: nickname,
          text: trimmed,
        }),
      });
      if (!res.ok) {
        console.error('Error sending message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const saveNickname = () => {
    const clean = tempNick.trim().slice(0, 20) || 'Player';
    setNickname(clean);
    localStorage.setItem('whatthegoy_nick', clean);
    setIsEditingNick(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 md:w-96 flex flex-col font-mono text-xs select-none">
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white border-2 border-white px-3 py-2 flex items-center justify-between cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] hover:bg-neutral-900 transition-colors"
      >
        <div className="flex items-center gap-2 font-bold tracking-wider">
          <MessageSquare className="w-4 h-4" />
          <span>LIVE CHAT</span>
          <span className="flex items-center gap-1.5 text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 border border-neutral-700">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {onlineCount} ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
            className="p-1 hover:text-neutral-300"
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
          </button>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Chat Body */}
      {isOpen && (
        <div className="bg-[#0a0a0a] border-x-2 border-b-2 border-white flex flex-col h-80 shadow-[3px_3px_0px_0px_#ffffff]">
          {/* Nickname Bar */}
          <div className="bg-black border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-neutral-400">
            {isEditingNick ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  value={tempNick}
                  onChange={(e) => setTempNick(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                  maxLength={18}
                  className="bg-neutral-900 text-white border border-white px-1.5 py-0.5 rounded-none text-xs flex-1 outline-none font-mono"
                  autoFocus
                />
                <button 
                  onClick={saveNickname}
                  className="bg-white text-black px-2 py-0.5 font-bold hover:bg-neutral-200"
                >
                  SAVE
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-white" />
                  <span>Chatting as: <strong className="text-white">{nickname}</strong></span>
                </div>
                <button 
                  onClick={() => { setTempNick(nickname); setIsEditingNick(true); }}
                  className="text-neutral-400 hover:text-white underline text-[10px]"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center gap-1">
                <p>No messages yet.</p>
                <p className="text-[10px]">Real peer chat &bull; No bots &bull; Say hi!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === nickname;
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id} className="flex flex-col group leading-snug">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-bold ${isMe ? 'text-white underline decoration-white/40' : 'text-neutral-300'}`}>
                        {msg.sender}:
                      </span>
                      <span className="text-neutral-100 break-words flex-1">{msg.text}</span>
                      <span className="text-[9px] text-neutral-600 font-mono select-none opacity-50 group-hover:opacity-100 transition-opacity">
                        {time}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-2 border-t border-neutral-800 bg-black flex gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message & press Enter..."
              maxLength={400}
              className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-white placeholder-neutral-500 outline-none text-xs font-mono"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-white text-black px-3 py-1.5 font-bold hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
