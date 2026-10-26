import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface EditPhotoModalProps {
  gameFilename: string;
  gameTitle: string;
  currentImageUrl?: string;
  adminToken: string;
  onClose: () => void;
  onSuccess: (updatedGame: any) => void;
}

export const EditPhotoModal: React.FC<EditPhotoModalProps> = ({
  gameFilename,
  gameTitle,
  currentImageUrl = '',
  adminToken,
  onClose,
  onSuccess,
}) => {
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl(`/api/games/${encodeURIComponent(gameFilename)}/photo`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },

        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update photo');
      }

      onSuccess(data.game);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-black border-2 border-white w-full max-w-sm text-white shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="border-b-2 border-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="font-bold text-xs uppercase tracking-wider">Set Photo: {gameTitle}</span>
          </div>
          <button onClick={onClose} className="hover:text-neutral-400 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
              autoFocus
            />
          </div>

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
              <span className="text-[10px] text-neutral-400 mt-1">Image Preview</span>
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
              className="px-3 py-1 border border-neutral-700 text-neutral-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black px-4 py-1 font-bold text-xs hover:bg-neutral-200 disabled:opacity-40"
            >
              {loading ? '...' : 'Save Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
