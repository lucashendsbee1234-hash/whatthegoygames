import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gamepad2, Search, Plus, ShieldAlert, RefreshCw, 
  ExternalLink, Play, Trash2, FolderPlus, Info, 
  Sparkles, Terminal, FileCode
} from 'lucide-react';
import { FakeGoogleDoc } from './components/FakeGoogleDoc';
import { LiveChat } from './components/LiveChat';
import { GamePlayerModal } from './components/GamePlayerModal';
import { AddGameModal } from './components/AddGameModal';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  // Fetch games from /api/games (which dynamically reads /games folder)
  const fetchGames = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
          setGames(data.games);
        }
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load + interval check to discover new .html files dropped in /games folder
  useEffect(() => {
    fetchGames();

    // Auto-rescan /games directory every 3.5 seconds
    const interval = setInterval(fetchGames, 3500);
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Connect to SSE for instant game added / deleted events & online count
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/chat/stream');
      es.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.onlineCount === 'number') {
            setOnlineCount(Math.max(1, data.onlineCount));
          }
        } catch {}
      });
      es.addEventListener('online', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.count === 'number') {
            setOnlineCount(Math.max(1, data.count));
          }
        } catch {}
      });
      es.addEventListener('game_added', () => {
        fetchGames();
      });
      es.addEventListener('game_deleted', () => {
        fetchGames();
      });
    } catch {}

    return () => {
      if (es) es.close();
    };
  }, [fetchGames]);

  // Global Panic Key Listener (Esc, `, or \)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle panic mode
      if (e.key === 'Escape' || e.key === '`' || e.key === '\\') {
        setIsPanic(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Drag and Drop handler for .html files anywhere on the screen
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsGlobalDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm'))) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const content = evt.target?.result as string;
        try {
          await fetch('/api/games/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, content }),
          });
          fetchGames();
        } catch (err) {
          console.error('Error auto-uploading dropped game:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteGame = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${filename} from /games folder?`)) {
      try {
        await fetch(`/api/games/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        fetchGames();
      } catch (err) {
        console.error('Failed to delete game:', err);
      }
    }
  };

  // Filter games based on search query
  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Panic Screen: Hyper-Realistic Google Doc */}
      {isPanic && (
        <FakeGoogleDoc onExit={() => setIsPanic(false)} />
      )}

      {/* Main whatthegoy Homepage */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-screen bg-black text-white font-mono flex flex-col selection:bg-white selection:text-black"
      >
        {/* Global Drag Overlay */}
        {isGlobalDragging && (
          <div className="fixed inset-0 z-50 bg-black/90 border-4 border-dashed border-white flex flex-col items-center justify-center p-8 pointer-events-none">
            <FileCode className="w-16 h-16 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold tracking-widest uppercase">DROP .HTML GAME HERE</h2>
            <p className="text-sm text-neutral-400 mt-2">Will be automatically written into /games and appear on the homepage</p>
          </div>
        )}

        {/* Top Navigation Bar */}
        <header className="border-b-2 border-white bg-black sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white text-black px-2.5 py-1 font-black text-lg tracking-tighter">
                WTG
              </div>
              <div>
                <h1 className="text-xl font-black tracking-widest uppercase leading-none">
                  whatthegoy
                </h1>
                <p className="text-[10px] text-neutral-400 tracking-wider uppercase mt-0.5">
                  super simple unblocked games
                </p>
              </div>
            </div>

            {/* Quick Actions & Panic Button */}
            <div className="flex items-center gap-2.5">
              {/* Live Real-time Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 text-[11px] text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{onlineCount} PLAYING</span>
              </div>

              {/* Add Game button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-white text-neutral-200 hover:text-white text-xs font-bold transition-colors"
                title="Add any .html game"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ADD</span> .HTML GAME
              </button>

              {/* Refresh folder scan button */}
              <button
                onClick={fetchGames}
                className="p-2 bg-neutral-900 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white text-xs transition-colors"
                title="Scan /games directory for newly added files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Panic Key / Button */}
              <button
                onClick={() => setIsPanic(true)}
                className="flex items-center gap-2 bg-white text-black px-3.5 py-1.5 font-black text-xs hover:bg-neutral-200 transition-colors shadow-[2px_2px_0px_0px_#ffffff]"
                title="Press Escape or ` anytime to disguise as a Google Doc"
              >
                <ShieldAlert className="w-4 h-4 text-black" />
                <span>PANIC (ESC)</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Notice Bar */}
        <div className="border-b border-neutral-800 bg-[#080808] px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold bg-neutral-900 px-1.5 py-0.5 border border-neutral-700 text-[10px]">
                TIP
              </span>
              <span>Drop any <code className="text-white">.html</code> file in <code className="text-white">/games</code> — it instantly loads here!</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              Panic Hotkeys: <kbd className="text-neutral-300 px-1 py-0.5 bg-neutral-900 border border-neutral-700">ESC</kbd> or <kbd className="text-neutral-300 px-1 py-0.5 bg-neutral-900 border border-neutral-700">`</kbd>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
          {/* Search & Stats Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-600 outline-none font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span>GAMES AVAILABLE: <strong className="text-white">{games.length}</strong></span>
              <span>&bull;</span>
              <span>SERVER PATH: <code className="text-neutral-300">/games/*.html</code></span>
            </div>
          </div>

          {/* Games Grid */}
          {filteredGames.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-800 p-12 text-center flex flex-col items-center justify-center gap-3">
              <Gamepad2 className="w-12 h-12 text-neutral-600" />
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
                {searchQuery ? `No games match "${searchQuery}"` : 'No games found in /games folder'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-md">
                Add an HTML game file to the <code className="text-white">/games</code> directory or click the button below to upload one.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 bg-white text-black font-bold px-4 py-2 text-xs hover:bg-neutral-200"
              >
                + ADD .HTML GAME NOW
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game)}
                  className="group relative bg-[#0a0a0a] border-2 border-neutral-800 hover:border-white p-4 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#ffffff]"
                >
                  <div>
                    {/* Top tag & actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 font-mono group-hover:border-neutral-600">
                        {game.filename}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:text-white text-neutral-500"
                          title="Open standalone"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => handleDeleteGame(e, game.filename)}
                          className="p-1 hover:text-rose-400 text-neutral-500"
                          title="Delete game from /games"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Game Title */}
                    <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 group-hover:underline">
                      {game.title}
                    </h2>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-6">
                      <span>{formatFileSize(game.size)}</span>
                      <span>&bull;</span>
                      <span>HTML5</span>
                    </div>
                  </div>

                  {/* Play Action button */}
                  <div className="pt-2 border-t border-neutral-900 group-hover:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 group-hover:text-white flex items-center gap-1.5 uppercase">
                      <Play className="w-3 h-3 fill-current" />
                      PLAY GAME
                    </span>
                    <span className="text-[10px] text-neutral-600 group-hover:text-neutral-400 font-mono">
                      READY
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick instructions / Unblocked features */}
          <div className="mt-8 border border-neutral-900 bg-[#070707] p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-400">
            <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-neutral-900 pb-3 md:pb-0 md:pr-3">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                <Terminal className="w-3.5 h-3.5" />
                Folder Auto-Scan
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Add any standalone <code className="text-neutral-300">.html</code> file to the <code className="text-neutral-300">/games</code> folder on your filesystem. It immediately registers on this page!
              </p>
            </div>

            <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-neutral-900 pb-3 md:pb-0 md:pr-3">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                Emergency Panic Key
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Hit <kbd className="text-white bg-neutral-900 px-1 py-0.5 border border-neutral-800">ESC</kbd> or <kbd className="text-white bg-neutral-900 px-1 py-0.5 border border-neutral-800">`</kbd> anytime to disguise this screen into a realistic editable Google Doc with tab spoofing!
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Pure Real Games & Chat
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                No simulated AI games, no AI fake stats, and no AI fake chats. Everything is 100% genuine code and real peer chat.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-900 bg-black py-4 px-4 text-center text-[11px] text-neutral-600">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>whatthegoy &bull; monochrome unblocked games hub</span>
            <span>Real HTML5 Canvas Games &bull; Safe & Fast</span>
          </div>
        </footer>

        {/* Modals & Live Chat */}
        {activeGame && (
          <GamePlayerModal
            game={activeGame}
            onClose={() => setActiveGame(null)}
            onPanic={() => setIsPanic(true)}
          />
        )}

        {isAddModalOpen && (
          <AddGameModal
            onClose={() => setIsAddModalOpen(false)}
            onGameAdded={(newGame) => {
              setGames(prev => [newGame, ...prev.filter(g => g.filename !== newGame.filename)]);
            }}
          />
        )}

        {/* Live Chat widget */}
        <LiveChat onlineCount={onlineCount} />
      </div>
    </>
  );
}
