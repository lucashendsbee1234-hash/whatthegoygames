import React, { useState } from 'react';
import { X, Image as ImageIcon, Type, Save } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface EditGameModalProps {
  gameFilename: string;
  gameTitle: string;
  currentImageUrl?: string;
  onClose: () => void;
  onSuccess: (updated: { filename: string; title: string; imageUrl: string }) => void;
}

export const EditGameModal: React.FC<EditGameModalProps> = ({
  gameFilename,
  gameTitle,
  currentImageUrl = '',
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(gameTitle);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanTitle = title.trim() || gameTitle;
    const cleanUrl = imageUrl.trim();

    try {
      // 1. Immediately persist locally
      try {
        localStorage.setItem(`wtg_title_${gameFilename}`, cleanTitle);
        localStorage.setItem(`wtg_photo_${gameFilename}`, cleanUrl);
      } catch {}

      // 2. Broadcast across tabs
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('wtg_games_channel');
          channel.postMessage({ 
            type: 'game_updated', 
            filename: gameFilename, 
            title: cleanTitle,
            imageUrl: cleanUrl 
          });
          channel.close();
        } catch {}
      }

      // 3. Update server if running
      try {
        await fetch(getApiUrl(`/api/games/${encodeURIComponent(gameFilename)}/photo`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: cleanTitle, imageUrl: cleanUrl }),
        });
      } catch {}

      onSuccess({ filename: gameFilename, title: cleanTitle, imageUrl: cleanUrl });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-black border-2 border-white w-full max-w-sm text-white shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="border-b-2 border-white px-4 py-2.5 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5">ADMIN</span>
            <span className="font-bold text-xs uppercase tracking-wider truncate max-w-[200px]">{gameFilename}</span>
          </div>
          <button onClick={onClose} className="hover:text-neutral-400 p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Game Title Input */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Type className="w-3 h-3 text-neutral-400" />
              <label className="text-[10px] text-neutral-400 uppercase font-bold">Game Title</label>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Retro Bowl, GTA III..."
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
              autoFocus
            />
          </div>

          {/* Picture / Image URL Input */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ImageIcon className="w-3 h-3 text-neutral-400" />
              <label className="text-[10px] text-neutral-400 uppercase font-bold">Picture / Thumbnail URL</label>
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
            />
          </div>

          {/* Picture Preview */}
          {imageUrl && (
            <div className="border border-neutral-800 p-1.5 bg-neutral-950 flex flex-col items-center">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-36 w-full object-contain border border-neutral-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                }}
              />
              <span className="text-[10px] text-neutral-400 mt-1">Picture Preview</span>
            </div>
          )}

          {error && (
            <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800 p-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border border-neutral-700 text-neutral-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black px-4 py-1 font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3 h-3" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
