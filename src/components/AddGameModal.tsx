import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, Check, AlertCircle } from 'lucide-react';

interface AddGameModalProps {
  onClose: () => void;
  onGameAdded: (game: any) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ onClose, onGameAdded }) => {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setError('Please select an .html file.');
      return;
    }
    setError(null);
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlContent(content);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
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
    if (!filename.trim()) {
      setError('Please provide a file name.');
      return;
    }
    if (!htmlContent.trim()) {
      setError('HTML content cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/games/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename.trim(),
          content: htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload game');
      }

      setSuccess(true);
      onGameAdded(data.game);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error uploading game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#0a0a0a] border-2 border-white w-full max-w-xl text-white shadow-[6px_6px_0px_0px_#ffffff] flex flex-col">
        {/* Header */}
        <div className="bg-black border-b-2 border-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-white" />
            <span className="font-bold tracking-wider text-sm">ADD .HTML GAME</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 border border-neutral-700 hover:border-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 p-3 leading-relaxed">
            <strong className="text-white block mb-1">AUTOMATIC /GAMES DISCOVERY</strong>
            Any <code className="text-white bg-neutral-900 px-1 py-0.5 border border-neutral-700">.html</code> file placed directly into the <code className="text-white bg-neutral-900 px-1 py-0.5 border border-neutral-700">/games</code> directory is detected instantly and added to the homepage! You can drop it into the folder or upload it here.
          </div>

          {/* Drag & drop box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
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
            <Upload className="w-8 h-8 mb-2 text-neutral-400" />
            <p className="text-xs font-bold text-white mb-1">
              {filename ? `Selected: ${filename}` : 'DRAG & DROP A .HTML GAME FILE HERE'}
            </p>
            <p className="text-[10px] text-neutral-500">or click to browse your computer</p>
          </div>

          {/* Filename input */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">TARGET FILENAME IN /GAMES</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. pacman.html, doom.html, mario.html"
              className="w-full bg-black border border-neutral-700 focus:border-white px-3 py-2 text-xs font-mono outline-none text-white"
            />
          </div>

          {/* Paste HTML option */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">HTML CODE (OR PASTE DIRECTLY)</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="<!DOCTYPE html><html><body>...</body></html>"
              rows={4}
              className="w-full bg-black border border-neutral-700 focus:border-white px-3 py-2 text-xs font-mono outline-none text-white resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 p-2.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>Game saved to /games folder and added to homepage!</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white text-xs"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !filename || !htmlContent}
              className="bg-white text-black px-5 py-2 font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'SAVING...' : 'ADD TO HOMEPAGE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
