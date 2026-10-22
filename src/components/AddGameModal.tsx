import React, { useState, useRef } from 'react';
import { X, Upload, FileCode } from 'lucide-react';

interface AddGameModalProps {
  adminToken: string;
  onClose: () => void;
  onGameAdded: (game: any) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ adminToken, onClose, onGameAdded }) => {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setError('Select an .html file.');
      return;
    }
    setError(null);
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setHtmlContent(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim() || !htmlContent.trim()) {
      setError('File and content required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/games/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          filename: filename.trim(),
          content: htmlContent,
          imageUrl: imageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload');
      }

      onGameAdded(data.game);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-black border-2 border-white w-full max-w-md text-white shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="border-b-2 border-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5" />
            <span className="font-bold text-xs uppercase tracking-wider">Upload Game</span>
          </div>
          <button onClick={onClose} className="hover:text-neutral-400 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              dragOver ? 'border-white bg-neutral-900' : 'border-neutral-700 hover:border-neutral-400 bg-neutral-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".html,.htm"
              className="hidden"
            />
            <Upload className="w-5 h-5 mb-1 text-neutral-400" />
            <p className="text-xs text-white">
              {filename ? filename : 'Drop .html game or browse'}
            </p>
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="game.html"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Photo / Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (e.g. cloudinary link)"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
            />
            {imageUrl && (
              <div className="mt-2 border border-neutral-800 p-1 flex items-center gap-2 bg-neutral-950">
                <img
                  src={imageUrl}
                  alt="Game Preview"
                  className="w-12 h-12 object-cover border border-neutral-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] text-neutral-400 truncate">Image preview</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">HTML Content</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="<!DOCTYPE html>..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none resize-none font-mono"
              required
            />
          </div>

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
              disabled={loading || !filename || !htmlContent}
              className="bg-white text-black px-4 py-1 font-bold text-xs hover:bg-neutral-200 disabled:opacity-40"
            >
              {loading ? '...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
