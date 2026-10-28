import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, ShieldAlert, Play, ExternalLink, Globe, 
  Shield, Image as ImageIcon, Trash2, Megaphone, Lock, Sparkles 
} from 'lucide-react';
import { FakeGoogleDoc } from './components/FakeGoogleDoc';
import { LiveChat } from './components/LiveChat';
import { GamePlayerModal } from './components/GamePlayerModal';
import { EditGameModal } from './components/EditGameModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { MatrixRain } from './components/MatrixRain';
import { SkywardPortal } from './components/SkywardPortal';
import { DEFAULT_GAMES, Game } from './utils/defaultGames';
import { getApiUrl } from './utils/api';
import { getSharedCookie, setSharedCookie, removeSharedCookie } from './utils/cookie';

export default function App() {
  const [games, setGames] = useState<Game[]>(() => {
    // Purge any stale deletion flag from previous sessions/subdomains
    try {
      localStorage.removeItem('wtg_deleted_games');
    } catch {}

    // Merge any locally saved photos and titles into default games
    return DEFAULT_GAMES.map(g => {
      try {
        const savedPhoto = localStorage.getItem(`wtg_photo_${g.filename}`);
        const savedTitle = localStorage.getItem(`wtg_title_${g.filename}`);
        return {
          ...g,
          ...(savedPhoto ? { imageUrl: savedPhoto } : {}),
          ...(savedTitle ? { title: savedTitle } : {}),
        };
      } catch {}
      return g;
    });
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPanic, setIsPanic] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return (
      sessionStorage.getItem('wtg_unlocked') === 'true' ||
      localStorage.getItem('wtg_unlocked') === 'true' ||
      getSharedCookie('wtg_unlocked') === 'true'
    );
  });

  // Secret Admin Mode: ONLY activated by renaming assignment to "whatthegoyadminpanel" in Panic mode
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('wtg_admin_active') === 'true';
  });
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Fun Admin Perks state
  const [isMatrixMode, setIsMatrixMode] = useState(false);
  const [isCrtMode, setIsCrtMode] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(() => {
    return localStorage.getItem('wtg_show_announcement') === 'true';
  });
  const [announcementText, setAnnouncementText] = useState(() => {
    return localStorage.getItem('wtg_announcement_text') || '⚡ WHATTHEGOY UNBLOCKED • NEW GAMES ADDED • CHAT ONLINE';
  });

  // Fetch games with live server sync and local photo/title merge
  const fetchGames = useCallback(async () => {
    let baseList = DEFAULT_GAMES;

    try {
      const res = await fetch(getApiUrl(`/api/games?_t=${Date.now()}`), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games) && data.games.length > 0) {
          baseList = data.games;
        }
      }
    } catch {}

    // CRITICAL: Clean up any stale wtg_deleted_games that previously hid games on subdomains
    try {
      localStorage.removeItem('wtg_deleted_games');
    } catch {}

    // Merge any custom games added via admin
    let customGames: Game[] = [];
    try {
      const customRaw = localStorage.getItem('wtg_custom_games');
      if (customRaw) customGames = JSON.parse(customRaw);
    } catch {}

    const combined = [...customGames, ...baseList.filter(b => !customGames.some(c => c.filename === b.filename))];

    const withCustomDetails = combined.map(g => {
      try {
        const customPhoto = localStorage.getItem(`wtg_photo_${g.filename}`);
        const customTitle = localStorage.getItem(`wtg_title_${g.filename}`);
        return {
          ...g,
          ...(customPhoto ? { imageUrl: customPhoto } : {}),
          ...(customTitle ? { title: customTitle } : {}),
        };
      } catch {}
      return g;
    });

    setGames(withCustomDetails);
  }, []);

  // Live real-time sync across all devices & tabs: SSE + periodic refresh
  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 4000);

    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupSSE = () => {
      try {
        if (es) es.close();
        es = new EventSource(getApiUrl('/api/chat/stream'));

        es.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.games && Array.isArray(data.games) && data.games.length > 0) {
              setGames(data.games);
            }
          } catch {}
        });

        es.addEventListener('games_sync', (e: MessageEvent) => {
          try {
            const list = JSON.parse(e.data);
            if (Array.isArray(list) && list.length > 0) {
              setGames(list);
            }
          } catch {
            fetchGames();
          }
        });

        es.addEventListener('game_updated', (e: MessageEvent) => {
          try {
            const updated: Game = JSON.parse(e.data);
            setGames(prev => prev.map(g => g.filename === updated.filename ? { ...g, ...updated } : g));
          } catch {
            fetchGames();
          }
        });

        es.addEventListener('game_deleted', (e: MessageEvent) => {
          try {
            const { filename } = JSON.parse(e.data);
            setGames(prev => prev.filter(g => g.filename !== filename));
          } catch {
            fetchGames();
          }
        });

        es.addEventListener('admin_broadcast', (e: MessageEvent) => {
          try {
            const { text } = JSON.parse(e.data);
            setLiveToast(`📢 ${text}`);
            setTimeout(() => setLiveToast(null), 6000);
          } catch {}
        });

        es.onerror = () => {
          es?.close();
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(setupSSE, 4000);
        };
      } catch {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(setupSSE, 5000);
      }
    };

    setupSSE();

    // Cross-tab broadcast channel for instant multi-tab sync
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('wtg_games_channel');
      channel.onmessage = (e) => {
        if (e.data?.type === 'game_deleted' && e.data?.filename) {
          setGames(prev => prev.filter(g => g.filename !== e.data.filename));
        } else if ((e.data?.type === 'game_updated' || e.data?.type === 'photo_updated') && e.data?.filename) {
          setGames(prev => prev.map(g => g.filename === e.data.filename ? { 
            ...g, 
            ...(e.data.title ? { title: e.data.title } : {}),
            ...(e.data.imageUrl !== undefined ? { imageUrl: e.data.imageUrl } : {}) 
          } : g));
        } else if (e.data?.type === 'broadcast_alert' && e.data?.text) {
          setLiveToast(`📢 ${e.data.text}`);
          setTimeout(() => setLiveToast(null), 6000);
        } else {
          fetchGames();
        }
      };
    }

    // Listen for cross-domain global relay events dispatched by LiveChat
    const handleRemoteGameUpdated = (e: any) => {
      const data = e.detail;
      if (data?.filename) {
        setGames(prev => prev.map(g => g.filename === data.filename ? {
          ...g,
          ...(data.title ? { title: data.title } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {})
        } : g));
      }
    };

    const handleRemoteGameDeleted = (e: any) => {
      const data = e.detail;
      if (data?.filename) {
        setGames(prev => prev.filter(g => g.filename !== data.filename));
      }
    };

    const handleRemoteBroadcast = (e: any) => {
      const data = e.detail;
      if (data?.text) {
        setLiveToast(`📢 ${data.text}`);
        setTimeout(() => setLiveToast(null), 6000);
      }
    };

    window.addEventListener('wtg_game_updated', handleRemoteGameUpdated);
    window.addEventListener('wtg_game_deleted', handleRemoteGameDeleted);
    window.addEventListener('wtg_admin_broadcast', handleRemoteBroadcast);

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout);
      if (es) es.close();
      if (channel) channel.close();
      window.removeEventListener('wtg_game_updated', handleRemoteGameUpdated);
      window.removeEventListener('wtg_game_deleted', handleRemoteGameDeleted);
      window.removeEventListener('wtg_admin_broadcast', handleRemoteBroadcast);
    };
  }, [fetchGames]);

  // Global Panic Key (Esc or `) and Cloak lock (F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '`') {
        setIsPanic(prev => !prev);
      }
      if (e.key === 'F2') {
        setIsUnlocked(false);
        sessionStorage.removeItem('wtg_unlocked');
        localStorage.removeItem('wtg_unlocked');
        removeSharedCookie('wtg_unlocked');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Restore title when game hub is unlocked
  useEffect(() => {
    if (isUnlocked && !isPanic) {
      document.title = 'whatthegoy';
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = './favicon.ico';
      }
    }
  }, [isUnlocked, isPanic]);

  // Delete game action (Only available in Admin Mode)
  const handleDeleteGame = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (confirmDelete !== filename) {
      setConfirmDelete(filename);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setConfirmDelete(null);

    // 1. Instant optimistic UI deletion
    setGames(prev => prev.filter(g => g.filename !== filename));

    // 2. Broadcast across tabs immediately
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('wtg_games_channel');
        channel.postMessage({ type: 'game_deleted', filename });
        channel.close();
      } catch {}
    }

    // 3. Broadcast to Global Cross-Domain Relay (syncs lazrhub.ink, subdomains, and mirrors)
    try {
      fetch('https://ntfy.sh/whatthegoy_chat_relay_9823', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'game_deleted', filename }),
      }).catch(() => {});
    } catch {}

    // 4. Delete on server if available
    try {
      await fetch(getApiUrl(`/api/games/${encodeURIComponent(filename)}`), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer drrtuiodrtduiivfgjxnflgk' },
      });
    } catch {}

    setLiveToast(`Deleted ${filename}`);
    setTimeout(() => setLiveToast(null), 3000);
  };

  // Exit / Lock Admin mode securely
  const handleExitAdmin = () => {
    setIsAdmin(false);
    setIsAdminPanelOpen(false);
    sessionStorage.removeItem('wtg_admin_active');
    setLiveToast('🔒 Admin mode locked. Visitor view active.');
    setTimeout(() => setLiveToast(null), 3000);
  };

  // Broadcast announcement to all users
  const handleBroadcastAnnouncement = (text: string) => {
    setLiveToast(`📢 ${text}`);
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('wtg_games_channel');
        channel.postMessage({ type: 'broadcast_alert', text });
        channel.close();
      } catch {}
    }
    // Cross-domain broadcast via global relay
    try {
      fetch('https://ntfy.sh/whatthegoy_chat_relay_9823', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin_broadcast', text }),
      }).catch(() => {});
    } catch {}
  };

  // Clear chat across server & local
  const handleAdminClearChat = async () => {
    try {
      localStorage.removeItem('wtg_chat_messages');
      await fetch(getApiUrl('/api/chat/clear'), {
        method: 'POST',
        headers: { 'Authorization': 'Bearer drrtuiodrtduiivfgjxnflgk' },
      });
    } catch {}
    setLiveToast('Chat nuked.');
    setTimeout(() => setLiveToast(null), 3000);
  };

  // Add game from Admin Panel
  const handleAddGameFromAdmin = (newGame: Game) => {
    setGames(prev => [newGame, ...prev.filter(g => g.filename !== newGame.filename)]);
    try {
      const customRaw = localStorage.getItem('wtg_custom_games');
      const customList = customRaw ? JSON.parse(customRaw) : [];
      localStorage.setItem('wtg_custom_games', JSON.stringify([newGame, ...customList.filter((g: any) => g.filename !== newGame.filename)]));
    } catch {}
    setLiveToast(`Added ${newGame.title}`);
    setTimeout(() => setLiveToast(null), 3000);
  };

  const handleUpdateAnnouncementText = (text: string) => {
    setAnnouncementText(text);
    try {
      localStorage.setItem('wtg_announcement_text', text);
    } catch {}
  };

  const handleToggleAnnouncement = () => {
    setShowAnnouncement(prev => {
      const next = !prev;
      try {
        localStorage.setItem('wtg_show_announcement', String(next));
      } catch {}
      return next;
    });
  };

  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isUnlocked) {
    return (
      <SkywardPortal
        onUnlock={() => {
          setIsUnlocked(true);
          sessionStorage.setItem('wtg_unlocked', 'true');
          localStorage.setItem('wtg_unlocked', 'true');
          setSharedCookie('wtg_unlocked', 'true');
          fetchGames();
        }}
      />
    );
  }

  return (
    <>
      {/* Panic Screen: Fake Google Doc (SECRET TRIGGER HERE) */}
      {isPanic && (
        <FakeGoogleDoc 
          onExit={() => setIsPanic(false)} 
          onAdminActivated={() => {
            setIsAdmin(true);
            sessionStorage.setItem('wtg_admin_active', 'true');
            setLiveToast('👑 WTG ADMIN PANEL ACTIVATED');
            setTimeout(() => setLiveToast(null), 4000);
          }}
        />
      )}

      {/* Fun Admin Perk: Matrix Rain Overlay */}
      {isMatrixMode && <MatrixRain />}

      {/* Fun Admin Perk: CRT Arcade Scanlines */}
      {isCrtMode && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px]" />
      )}

      <div className={`min-h-screen bg-black text-white font-mono flex flex-col relative ${isMatrixMode ? 'bg-black/90' : ''}`}>
        {/* Optional Marquee Announcement Ticker */}
        {showAnnouncement && announcementText && (
          <div className="bg-yellow-400 text-black py-1 px-4 overflow-hidden whitespace-nowrap text-xs font-black tracking-wider flex items-center z-30">
            <span className="shrink-0 flex items-center gap-1 mr-4 bg-black text-yellow-400 px-1.5 py-0.2">
              <Megaphone className="w-3 h-3" />
              <span>ALERT</span>
            </span>
            <div className="animate-marquee inline-block">
              {announcementText} ••• {announcementText} ••• {announcementText}
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="border-b-2 border-white bg-black sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="bg-white text-black px-2 py-0.5 font-bold text-sm">WTG</span>
              <h1 className="text-lg font-bold uppercase tracking-wider">whatthegoy</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* ADMIN MODE STATUS BADGE & DASHBOARD BUTTON */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                  <button
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
                    title="Open WTG Admin Panel"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>ADMIN PANEL</span>
                  </button>

                  <button
                    onClick={handleExitAdmin}
                    className="flex items-center gap-1 px-2 py-1 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white text-xs transition-colors cursor-pointer"
                    title="Exit Admin Mode"
                  >
                    <Lock className="w-3 h-3" />
                    <span className="hidden sm:inline">LOCK</span>
                  </button>
                </div>
              )}

              {/* Cloak / Lock Back to Skyward Portal */}
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  sessionStorage.removeItem('wtg_unlocked');
                  localStorage.removeItem('wtg_unlocked');
                  removeSharedCookie('wtg_unlocked');
                }}
                className="flex items-center gap-1.5 border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:border-white transition-colors cursor-pointer"
                title="Cloak back to Skyward Portal (F2)"
              >
                <Globe className="w-3.5 h-3.5 text-[#00c2e8]" />
                <span className="hidden sm:inline font-bold">SKYWARD</span>
              </button>

              {/* Panic Button */}
              <button
                onClick={() => setIsPanic(true)}
                className="flex items-center gap-1.5 border border-white px-3 py-1 font-bold text-xs hover:bg-white hover:text-black transition-colors cursor-pointer"
                title="Panic to Google Doc (ESC)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>PANIC</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-5 z-10">
          {/* Live Notification Toast */}
          {liveToast && (
            <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-3.5 py-2 text-xs flex items-center justify-between shadow-md">
              <span className="font-bold">{liveToast}</span>
              <button 
                onClick={() => setLiveToast(null)} 
                className="text-emerald-400 hover:text-white font-bold ml-2 text-xs p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 outline-none"
            />
          </div>

          {/* Games Grid */}
          {filteredGames.length === 0 ? (
            <div className="border border-neutral-800 p-12 text-center text-neutral-500 text-xs">
              {searchQuery ? 'No matching games found.' : 'No games available.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game)}
                  className="bg-black border border-neutral-800 hover:border-white flex flex-col justify-between cursor-pointer transition-colors group overflow-hidden"
                >
                  {/* Game Photo / Banner */}
                  {game.imageUrl ? (
                    <div className="w-full h-28 sm:h-32 bg-neutral-950 overflow-hidden relative border-b border-neutral-800">
                      <img
                        src={game.imageUrl}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-28 sm:h-32 bg-gradient-to-br from-neutral-900 to-neutral-950 border-b border-neutral-800 flex flex-col items-center justify-center p-3 text-center group-hover:border-neutral-600 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs mb-1.5 shadow-sm">
                        {game.title.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-bold tracking-wider truncate max-w-full">
                        {game.title}
                      </span>
                    </div>
                  )}

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-neutral-500 truncate max-w-[110px]">
                          {game.filename}
                        </span>

                        {/* ADMIN-ONLY BUTTONS (Visible only when secret admin mode is unlocked) */}
                        {isAdmin && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGame(game);
                              }}
                              className="text-emerald-400 hover:text-white p-0.5 cursor-pointer"
                              title="Admin: Edit Title & Picture"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteGame(e, game.filename)}
                              className={`p-0.5 text-xs transition-colors cursor-pointer ${
                                confirmDelete === game.filename ? 'text-red-400 font-bold' : 'text-neutral-500 hover:text-red-400'
                              }`}
                              title={confirmDelete === game.filename ? 'Click again to confirm delete' : 'Admin: Delete game'}
                            >
                              {confirmDelete === game.filename ? 'DEL?' : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>

                      <h2 className="text-xs font-bold text-white uppercase tracking-wide group-hover:underline">
                        {game.title}
                      </h2>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1 group-hover:text-white font-bold">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        PLAY
                      </span>
                      <a
                        href={game.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-white cursor-pointer"
                        title="Open game in standalone new tab"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modals */}
        {activeGame && (
          <GamePlayerModal
            game={activeGame}
            onClose={() => setActiveGame(null)}
            onPanic={() => setIsPanic(true)}
          />
        )}

        {/* Admin Title & Picture Editor */}
        {isAdmin && editingGame && (
          <EditGameModal
            gameFilename={editingGame.filename}
            gameTitle={editingGame.title}
            currentImageUrl={editingGame.imageUrl || ''}
            onClose={() => setEditingGame(null)}
            onSuccess={(updated) => {
              setGames(prev => prev.map(g => g.filename === updated.filename ? { ...g, ...updated } : g));
            }}
          />
        )}

        {/* Full WTG Secret Admin Panel Dashboard */}
        {isAdmin && isAdminPanelOpen && (
          <AdminPanelModal
            games={games}
            onClose={() => setIsAdminPanelOpen(false)}
            onExitAdmin={handleExitAdmin}
            onEditGame={(game) => {
              setIsAdminPanelOpen(false);
              setEditingGame(game);
            }}
            onDeleteGame={(filename) => {
              handleDeleteGame({ stopPropagation: () => {} } as any, filename);
            }}
            onAddGame={handleAddGameFromAdmin}
            onBroadcastAnnouncement={handleBroadcastAnnouncement}
            onClearChat={handleAdminClearChat}
            isMatrixMode={isMatrixMode}
            onToggleMatrixMode={() => setIsMatrixMode(prev => !prev)}
            isCrtMode={isCrtMode}
            onToggleCrtMode={() => setIsCrtMode(prev => !prev)}
            announcementText={announcementText}
            onSetAnnouncementText={handleUpdateAnnouncementText}
            showAnnouncement={showAnnouncement}
            onToggleAnnouncement={handleToggleAnnouncement}
          />
        )}

        {/* Live Chat (Admin tools enabled only when isAdmin is true) */}
        <LiveChat isAdmin={isAdmin} />
      </div>
    </>
  );
}
