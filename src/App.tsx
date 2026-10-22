import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ShieldAlert, Play, Trash2, LogIn, LogOut, ExternalLink } from 'lucide-react';
import { FakeGoogleDoc } from './components/FakeGoogleDoc';
import { LiveChat } from './components/LiveChat';
import { GamePlayerModal } from './components/GamePlayerModal';
import { AddGameModal } from './components/AddGameModal';
import { AdminLoginModal } from './components/AdminLoginModal';

interface Game {
  id: string;
  filename: string;
  title: string;
  url: string;
  size: number;
  updatedAt: number;
}

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPanic, setIsPanic] = useState(false);
  
  // Admin auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Verify stored admin token on start
  useEffect(() => {
    const savedToken = localStorage.getItem('wtg_admin_token');
    if (savedToken) {
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
        .catch(() => {});
    }
  }, []);

  // Fetch games
  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
          setGames(data.games);
        }
      }
    } catch {}
  }, []);

  // Live cross-device sync: SSE + frequent poll fallback
  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 2500);

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/chat/stream');
      es.addEventListener('game_added', (e: MessageEvent) => {
        try {
          const game: Game = JSON.parse(e.data);
          setGames(prev => [game, ...prev.filter(g => g.filename !== game.filename)]);
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
    } catch {}

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, [fetchGames]);

  // Global Panic Key (Esc or `)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '`') {
        setIsPanic(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDeleteGame = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    if (!isAdmin || !adminToken) return;
    if (confirmDelete !== filename) {
      setConfirmDelete(filename);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setConfirmDelete(null);
    try {
      await fetch(`/api/games/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      setGames(prev => prev.filter(g => g.filename !== filename));
    } catch {}
  };

  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

              {/* Panic Button */}
              <button
                onClick={() => setIsPanic(true)}
                className="flex items-center gap-1.5 border border-white px-3 py-1 font-bold text-xs hover:bg-white hover:text-black transition-colors"
                title="Panic to Google Doc"
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
                  className="bg-black border border-neutral-800 hover:border-white p-3 flex flex-col justify-between cursor-pointer transition-colors group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-neutral-500 truncate max-w-[110px]">
                        {game.filename}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteGame(e, game.filename)}
                          className={`p-0.5 text-xs transition-colors ${
                            confirmDelete === game.filename ? 'text-red-400 font-bold' : 'text-neutral-500 hover:text-red-400'
                          }`}
                          title={confirmDelete === game.filename ? 'Click again to delete' : 'Delete game'}
                        >
                          {confirmDelete === game.filename ? 'DEL?' : <Trash2 className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wide group-hover:underline">
                      {game.title}
                    </h2>
                  </div>

                  <div className="mt-4 pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1 group-hover:text-white">
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
