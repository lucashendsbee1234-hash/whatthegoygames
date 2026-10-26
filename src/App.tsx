import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ShieldAlert, Play, Trash2, LogIn, LogOut, ExternalLink, Image as ImageIcon, Globe } from 'lucide-react';
import { FakeGoogleDoc } from './components/FakeGoogleDoc';
import { LiveChat } from './components/LiveChat';
import { GamePlayerModal } from './components/GamePlayerModal';
import { AddGameModal } from './components/AddGameModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { EditPhotoModal } from './components/EditPhotoModal';
import { SkywardPortal } from './components/SkywardPortal';
import { DEFAULT_GAMES, Game } from './utils/defaultGames';

export default function App() {
  const [games, setGames] = useState<Game[]>(() => DEFAULT_GAMES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPanic, setIsPanic] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('wtg_unlocked') === 'true');
  const [liveToast, setLiveToast] = useState<string | null>(null);
  
  // Admin auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPhotoGame, setEditingPhotoGame] = useState<Game | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Verify stored admin token on start (Works seamlessly on GitHub Pages and AI Studio)
  useEffect(() => {
    const savedToken = localStorage.getItem('wtg_admin_token');
    if (savedToken) {
      if (
        savedToken.startsWith('wtg_client_') || 
        savedToken === 'drrtuiodrtduiivfgjxnflgk' || 
        savedToken.startsWith('wtg_master_')
      ) {
        setIsAdmin(true);
        setAdminToken(savedToken);
        return;
      }

      fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${savedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setIsAdmin(true);
            setAdminToken(savedToken);
          } else {
            localStorage.removeItem('wtg_admin_token');
          }
        })
        .catch(() => {
          // Fallback for GitHub Pages where /api/ doesn't exist
          setIsAdmin(true);
          setAdminToken(savedToken);
        });
    }
  }, []);

  // Fetch games with cache-busting and live server sync
  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch(`/api/games?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
          setGames(data.games);
          return;
        }
      }
    } catch {}

    // GitHub Pages / Static fallback: merge DEFAULT_GAMES + any custom uploaded games
    try {
      const customRaw = localStorage.getItem('wtg_custom_games');
      const customGames: Game[] = customRaw ? JSON.parse(customRaw) : [];
      const deletedRaw = localStorage.getItem('wtg_deleted_games');
      const deletedGames: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];

      const baseList = DEFAULT_GAMES.filter(g => !deletedGames.includes(g.filename));
      const combined = [...customGames, ...baseList.filter(b => !customGames.some(c => c.filename === b.filename))];
      setGames(combined);
    } catch {
      setGames(DEFAULT_GAMES);
    }
  }, []);

  // Live real-time sync across all devices & tabs: SSE + frequent poll fallback
  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 1500);

    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupSSE = () => {
      try {
        if (es) es.close();
        es = new EventSource('/api/chat/stream');

        es.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.games && Array.isArray(data.games)) {
              setGames(data.games);
            }
          } catch {}
        });

        es.addEventListener('games_sync', (e: MessageEvent) => {
          try {
            const list = JSON.parse(e.data);
            if (Array.isArray(list)) {
              setGames(list);
            }
          } catch {
            fetchGames();
          }
        });

        es.addEventListener('game_added', (e: MessageEvent) => {
          try {
            const game: Game = JSON.parse(e.data);
            setGames(prev => [game, ...prev.filter(g => g.filename !== game.filename)]);
            setLiveToast(`🎮 New Game Added: "${game.title}"! Live for everyone.`);
            setTimeout(() => setLiveToast(null), 5000);
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
            setLiveToast(`🗑️ Game removed.`);
            setTimeout(() => setLiveToast(null), 3000);
          } catch {
            fetchGames();
          }
        });

        es.onerror = () => {
          es?.close();
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(setupSSE, 2000);
        };
      } catch {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(setupSSE, 3000);
      }
    };

    setupSSE();

    // Cross-tab broadcast channel for instant multi-tab sync
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('wtg_games_channel');
      channel.onmessage = (e) => {
        if (e.data?.type === 'game_added' && e.data?.game) {
          setGames(prev => [e.data.game, ...prev.filter(g => g.filename !== e.data.game.filename)]);
        } else if (e.data?.type === 'game_deleted' && e.data?.filename) {
          setGames(prev => prev.filter(g => g.filename !== e.data.filename));
        } else {
          fetchGames();
        }
      };
    }

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout);
      if (es) es.close();
      if (channel) channel.close();
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
        link.href = '/favicon.ico';
      }
    }
  }, [isUnlocked, isPanic]);

  const handleLoginSuccess = (token: string) => {
    setIsAdmin(true);
    setAdminToken(token);
    localStorage.setItem('wtg_admin_token', token);
  };

  const handleLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem('wtg_admin_token');
  };

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

    // 3. Persist deletion in localStorage (for GitHub Pages and reloads)
    try {
      const customRaw = localStorage.getItem('wtg_custom_games');
      if (customRaw) {
        const customGames: Game[] = JSON.parse(customRaw);
        localStorage.setItem('wtg_custom_games', JSON.stringify(customGames.filter(g => g.filename !== filename)));
      }
      const deletedRaw = localStorage.getItem('wtg_deleted_games');
      const deleted: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deleted.includes(filename)) {
        deleted.push(filename);
        localStorage.setItem('wtg_deleted_games', JSON.stringify(deleted));
      }
    } catch {}

    // 3. Delete on server
    const tokenToSend = adminToken || localStorage.getItem('wtg_admin_token') || 'drrtuiodrtduiivfgjxnflgk';
    try {
      await fetch(`/api/games/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenToSend}` },
      });
    } catch {}
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
          fetchGames();
        }}
      />
    );
  }

  return (
    <>
      {/* Panic Screen: Fake Google Doc */}
      {isPanic && <FakeGoogleDoc onExit={() => setIsPanic(false)} />}

      <div className="min-h-screen bg-black text-white font-mono flex flex-col">
        {/* Header */}
        <header className="border-b-2 border-white bg-black sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="bg-white text-black px-2 py-0.5 font-bold text-sm">WTG</span>
              <h1 className="text-lg font-bold uppercase tracking-wider">whatthegoy</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Only show Add Game for Admin */}
              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white text-black text-xs font-bold hover:bg-neutral-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD GAME</span>
                </button>
              )}

              {/* Cloak / Lock Back to Skyward Portal */}
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  sessionStorage.removeItem('wtg_unlocked');
                }}
                className="flex items-center gap-1.5 border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:border-white transition-colors"
                title="Cloak back to Skyward Portal (F2)"
              >
                <Globe className="w-3.5 h-3.5 text-[#00c2e8]" />
                <span className="hidden sm:inline font-bold">SKYWARD</span>
              </button>

              {/* Panic Button */}
              <button
                onClick={() => setIsPanic(true)}
                className="flex items-center gap-1.5 border border-white px-3 py-1 font-bold text-xs hover:bg-white hover:text-black transition-colors"
                title="Panic to Google Doc (ESC)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>PANIC</span>
              </button>

              {/* Admin Sign In / Logout */}
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-white"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LOGOUT</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-500"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>SIGN IN</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
          {/* Live Notification Toast */}
          {liveToast && (
            <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-300 px-3.5 py-2 text-xs flex items-center justify-between shadow-md">
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
              placeholder="Search..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 outline-none"
            />
          </div>

          {/* Games Grid */}
          {filteredGames.length === 0 ? (
            <div className="border border-neutral-800 p-12 text-center text-neutral-500 text-xs">
              {searchQuery ? 'No matching games.' : 'No games yet.'}
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
                          // Clean fallback instead of blank card
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
                        <span className="text-[10px] text-neutral-500 truncate max-w-[90px]">
                          {game.filename}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPhotoGame(game);
                              }}
                              className="text-neutral-500 hover:text-white p-0.5"
                              title="Set or change photo"
                            >
                              <ImageIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteGame(e, game.filename)}
                              className={`p-0.5 text-xs transition-colors ${
                                confirmDelete === game.filename ? 'text-red-400 font-bold' : 'text-neutral-500 hover:text-red-400'
                              }`}
                              title={confirmDelete === game.filename ? 'Click again to delete' : 'Delete game'}
                            >
                              {confirmDelete === game.filename ? 'DEL?' : <Trash2 className="w-3 h-3" />}
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
                        className="hover:text-white"
                        title="New Tab"
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

        {/* Modals & Live Chat */}
        {activeGame && (
          <GamePlayerModal
            game={activeGame}
            onClose={() => setActiveGame(null)}
            onPanic={() => setIsPanic(true)}
          />
        )}

        {isAddModalOpen && adminToken && (
          <AddGameModal
            adminToken={adminToken}
            onClose={() => setIsAddModalOpen(false)}
            onGameAdded={(newGame) => {
              setGames(prev => [newGame, ...prev.filter(g => g.filename !== newGame.filename)]);
              fetchGames();
            }}
          />
        )}

        {editingPhotoGame && adminToken && (
          <EditPhotoModal
            gameFilename={editingPhotoGame.filename}
            gameTitle={editingPhotoGame.title}
            currentImageUrl={editingPhotoGame.imageUrl || ''}
            adminToken={adminToken}
            onClose={() => setEditingPhotoGame(null)}
            onSuccess={(updated) => {
              setGames(prev => prev.map(g => g.filename === updated.filename ? { ...g, ...updated } : g));
            }}
          />
        )}

        {isLoginModalOpen && (
          <AdminLoginModal
            onClose={() => setIsLoginModalOpen(false)}
            onSuccess={handleLoginSuccess}
          />
        )}

        {/* Live Chat with Admin controls */}
        <LiveChat isAdmin={isAdmin} adminToken={adminToken} />
      </div>
    </>
  );
}
