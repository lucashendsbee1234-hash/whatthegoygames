import React, { useState } from 'react';
import { 
  X, Shield, Gamepad2, MessageSquare, Sparkles, Plus, 
  Trash2, Image as ImageIcon, Megaphone, Terminal, RefreshCw, 
  Sliders, EyeOff, Check, ExternalLink 
} from 'lucide-react';
import { Game } from '../utils/defaultGames';
import { getApiUrl } from '../utils/api';

interface AdminPanelModalProps {
  games: Game[];
  onClose: () => void;
  onExitAdmin: () => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (filename: string) => void;
  onAddGame: (game: Game) => void;
  onBroadcastAnnouncement: (text: string) => void;
  onClearChat: () => void;
  isMatrixMode: boolean;
  onToggleMatrixMode: () => void;
  isCrtMode: boolean;
  onToggleCrtMode: () => void;
  announcementText: string;
  onSetAnnouncementText: (text: string) => void;
  showAnnouncement: boolean;
  onToggleAnnouncement: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  games,
  onClose,
  onExitAdmin,
  onEditGame,
  onDeleteGame,
  onAddGame,
  onBroadcastAnnouncement,
  onClearChat,
  isMatrixMode,
  onToggleMatrixMode,
  isCrtMode,
  onToggleCrtMode,
  announcementText,
  onSetAnnouncementText,
  showAnnouncement,
  onToggleAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'chat' | 'fun' | 'add'>('games');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  // New game form state
  const [newTitle, setNewTitle] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastInput.trim()) return;
    onBroadcastAnnouncement(broadcastInput.trim());
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
    setBroadcastInput('');
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFilename.trim() || !newUrl.trim()) return;

    let cleanFilename = newFilename.trim();
    if (!cleanFilename.endsWith('.html')) {
      cleanFilename += '.html';
    }

    const createdGame: Game = {
      id: cleanFilename,
      filename: cleanFilename,
      title: newTitle.trim(),
      url: newUrl.trim(),
      imageUrl: newImageUrl.trim() || undefined,
      size: 4096,
      updatedAt: Date.now(),
    };

    onAddGame(createdGame);
    setAddSuccess(true);
    setNewTitle('');
    setNewFilename('');
    setNewUrl('');
    setNewImageUrl('');
    setTimeout(() => {
      setAddSuccess(false);
      setActiveTab('games');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-mono select-none">
      <div className="bg-black border-2 border-white w-full max-w-3xl text-white shadow-[6px_6px_0px_0px_#ffffff] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="border-b-2 border-white px-4 py-3 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-400 text-black px-2 py-0.5 text-xs font-black tracking-widest">
              ROOT ADMIN
            </span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">WTG MASTER CONTROL PANEL</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitAdmin}
              className="px-2.5 py-1 text-xs border border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Lock and return to visitor view"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXIT ADMIN</span>
            </button>
            <button 
              onClick={onClose} 
              className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-800 bg-neutral-900 px-4 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('games')}
            className={`px-3 py-2.5 flex items-center gap-1.5 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'games'
                ? 'border-white text-white bg-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>GAMES ({games.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-3 py-2.5 flex items-center gap-1.5 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'add'
                ? 'border-white text-white bg-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ ADD GAME</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-2.5 flex items-center gap-1.5 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'chat'
                ? 'border-white text-white bg-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>CHAT MOD</span>
          </button>

          <button
            onClick={() => setActiveTab('fun')}
            className={`px-3 py-2.5 flex items-center gap-1.5 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'fun'
                ? 'border-white text-white bg-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>FUN ADMIN PERKS</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: GAMES MANAGEMENT */}
          {activeTab === 'games' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-2">
                <span>Directly edit game titles, update thumbnail photos, or delete games:</span>
                <button
                  onClick={() => setActiveTab('add')}
                  className="bg-white text-black px-2.5 py-1 font-bold flex items-center gap-1 hover:bg-neutral-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>NEW GAME</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="border border-neutral-800 bg-neutral-950 p-2.5 flex items-center justify-between gap-3 hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {game.imageUrl ? (
                        <img
                          src={game.imageUrl}
                          alt={game.title}
                          className="w-10 h-10 object-cover border border-neutral-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {game.title.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs text-white truncate max-w-[150px]">{game.title}</h4>
                        <span className="text-[10px] text-neutral-500 font-mono truncate block max-w-[150px]">{game.filename}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditGame(game)}
                        className="p-1.5 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit Title & Picture"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGame(game.filename)}
                        className="p-1.5 border border-neutral-700 hover:border-red-500 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Game"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ADD NEW GAME */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateGame} className="space-y-3.5 max-w-lg mx-auto bg-neutral-950 p-4 border border-neutral-800">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs font-bold text-emerald-400">
                <Plus className="w-4 h-4" />
                <span>INJECT NEW GAME INTO HUB</span>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Game Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 1v1.LOL, Slope, Cookie Clicker..."
                  className="w-full bg-black border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">HTML Filename</label>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="e.g. slope.html"
                  className="w-full bg-black border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Game URL or Embed Link</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="./games/slope.html or https://..."
                  className="w-full bg-black border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Picture / Thumbnail URL (Optional)</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-black border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              {addSuccess && (
                <div className="bg-emerald-950/70 border border-emerald-500 text-emerald-300 p-2 text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4" />
                  <span>Game successfully injected!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('games')}
                  className="px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-400 hover:bg-emerald-300 text-black px-4 py-1.5 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD TO CATALOG</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CHAT MODERATION */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-white">
                  <Megaphone className="w-4 h-4 text-emerald-400" />
                  <span>Broadcast Live Alert To All Users</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Sends an immediate broadcast toast across every active user screen right now:
                </p>

                <form onSubmit={handleSendBroadcast} className="flex gap-2">
                  <input
                    type="text"
                    value={broadcastInput}
                    onChange={(e) => setBroadcastInput(e.target.value)}
                    placeholder="e.g. 📢 Tourney starts at 3PM! Check new games..."
                    className="flex-1 bg-black border border-neutral-700 focus:border-white px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-white text-black px-4 py-1.5 font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    SEND ALERT
                  </button>
                </form>

                {broadcastSent && (
                  <div className="text-xs text-emerald-400 font-bold">
                    ✔ Broadcast sent to all connected players!
                  </div>
                )}
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-red-400 uppercase">Emergency Chat Clear</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Instantly wipes all chat messages across the live server and user devices.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!confirmClearChat) {
                      setConfirmClearChat(true);
                      setTimeout(() => setConfirmClearChat(false), 3000);
                      return;
                    }
                    onClearChat();
                    setConfirmClearChat(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                    confirmClearChat
                      ? 'bg-red-600 text-white border-red-600 animate-pulse'
                      : 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  {confirmClearChat ? 'CONFIRM NUKE?' : 'CLEAR CHAT'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: FUN ADMIN PERKS */}
          {activeTab === 'fun' && (
            <div className="space-y-4">
              {/* Marquee Banner Tool */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-yellow-400">
                    <Megaphone className="w-4 h-4" />
                    <span>Top Scrolling Marquee Ticker</span>
                  </div>
                  <button
                    onClick={onToggleAnnouncement}
                    className={`px-2.5 py-0.5 text-xs font-bold border transition-colors cursor-pointer ${
                      showAnnouncement 
                        ? 'bg-yellow-400 text-black border-yellow-400' 
                        : 'border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {showAnnouncement ? 'ON' : 'OFF'}
                  </button>
                </div>

                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => onSetAnnouncementText(e.target.value)}
                  placeholder="Custom scrolling marquee text..."
                  className="w-full bg-black border border-neutral-700 focus:border-white px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              {/* Visual Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Matrix Rain */}
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Matrix Rain Overlay</span>
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Falling green digital code stream</p>
                  </div>
                  <button
                    onClick={onToggleMatrixMode}
                    className={`px-3 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                      isMatrixMode 
                        ? 'bg-emerald-400 text-black border-emerald-400' 
                        : 'border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isMatrixMode ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                {/* CRT Scanlines */}
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Retro CRT Scanlines</span>
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Classic arcade monitor filter</p>
                  </div>
                  <button
                    onClick={onToggleCrtMode}
                    className={`px-3 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                      isCrtMode 
                        ? 'bg-cyan-400 text-black border-cyan-400' 
                        : 'border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isCrtMode ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
