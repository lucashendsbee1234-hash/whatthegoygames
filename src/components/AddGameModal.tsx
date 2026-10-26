import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, Globe, Code } from 'lucide-react';

interface AddGameModalProps {
  adminToken: string;
  onClose: () => void;
  onGameAdded: (game: any) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ adminToken, onClose, onGameAdded }) => {
  const [tab, setTab] = useState<'file' | 'url' | 'code'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeName = cleanName.toLowerCase().endsWith('.html') || cleanName.toLowerCase().endsWith('.htm')
      ? cleanName
      : `${cleanName}.html`;

    setFilename(safeName);

    if (!title) {
      const suggestedTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(suggestedTitle);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setHtmlContent((e.target?.result as string) || '');
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
    setError(null);

    let finalContent = htmlContent.trim();
    let finalFilename = filename.trim();

    // If in URL mode, generate standalone iframe game runner
    if (tab === 'url') {
      const cleanUrl = gameUrl.trim();
      if (!cleanUrl) {
        setError('Please enter a game URL.');
        return;
      }
      const safeGameTitle = title.trim() || 'Online Game';
      finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeGameTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe src="${cleanUrl}" allowfullscreen allow="autoplay; fullscreen; gamepad; focus-without-user-activation *"></iframe>
</body>
</html>`;

      if (!finalFilename) {
        finalFilename = `${safeGameTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
      }
    }

    if (!finalFilename) {
      finalFilename = `${(title.trim() || 'game').toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    }
    if (!finalFilename.toLowerCase().endsWith('.html') && !finalFilename.toLowerCase().endsWith('.htm')) {
      finalFilename += '.html';
    }

    if (!finalContent) {
      setError('Please upload a file, paste HTML code, or enter a game URL.');
      return;
    }

    setLoading(true);

    try {
      let res: Response | null = null;
      let data: any = null;

      try {
        res = await fetch('/api/games/upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            filename: finalFilename,
            title: title.trim() || undefined,
            content: finalContent,
            imageUrl: imageUrl.trim() || undefined,
          }),
        });
        if (res.ok) {
          data = await res.json().catch(() => null);
        }
      } catch {}

      if (res && res.ok && data?.success && data?.game) {
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const channel = new BroadcastChannel('wtg_games_channel');
            channel.postMessage({ type: 'game_added', game: data.game });
            channel.close();
          } catch {}
        }
        onGameAdded(data.game);
        onClose();
        return;
      }

      // GitHub Pages / Static fallback:
      const blob = new Blob([finalContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const newGame = {
        id: finalFilename,
        filename: finalFilename,
        title: title.trim() || finalFilename.replace(/\.html$/i, ''),
        url: blobUrl,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
        size: finalContent.length,
        updatedAt: Date.now(),
      };

      try {
        const raw = localStorage.getItem('wtg_custom_games');
        const custom: any[] = raw ? JSON.parse(raw) : [];
        const filtered = custom.filter((g: any) => g.filename !== finalFilename);
        localStorage.setItem('wtg_custom_games', JSON.stringify([newGame, ...filtered]));
      } catch {}

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('wtg_games_channel');
          channel.postMessage({ type: 'game_added', game: newGame });
          channel.close();
        } catch {}
      }

      onGameAdded(newGame);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-black border-2 border-white w-full max-w-lg text-white shadow-[4px_4px_0px_0px_#ffffff]">
        {/* Header */}
        <div className="border-b-2 border-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5" />
            <span className="font-bold text-xs uppercase tracking-wider">Add Game to Hub</span>
          </div>
          <button onClick={onClose} className="hover:text-neutral-400 p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Tabs */}
        <div className="flex border-b border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer ${
              tab === 'file' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white bg-neutral-950'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer ${
              tab === 'url' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white bg-neutral-950'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Game URL</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer ${
              tab === 'code' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white bg-neutral-950'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw HTML</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Game Title */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Game Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Retro Bowl, Slope, 1v1.LOL"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
              required
            />
          </div>

          {/* Tab 1: File Upload */}
          {tab === 'file' && (
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1 uppercase">HTML File</label>
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
                  accept=".html,.htm,.txt,*"
                  className="hidden"
                />
                <Upload className="w-5 h-5 mb-1 text-neutral-400" />
                <p className="text-xs text-white">
                  {filename ? filename : 'Drop .html game file or click to browse'}
                </p>
                {htmlContent && (
                  <span className="text-[10px] text-neutral-400 mt-1">
                    Loaded ({Math.round(htmlContent.length / 1024)} KB)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Game URL Embed */}
          {tab === 'url' && (
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Web Game URL</label>
              <input
                type="url"
                value={gameUrl}
                onChange={(e) => {
                  setGameUrl(e.target.value);
                  if (!filename && title) {
                    setFilename(`${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`);
                  }
                }}
                placeholder="https://example.com/games/mygame/index.html"
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Any online web game URL will be bundled into a full-screen standalone runner.
              </p>
            </div>
          )}

          {/* Tab 3: Raw HTML Code */}
          {tab === 'code' && (
            <div>
              <label className="block text-[10px] text-neutral-400 mb-1 uppercase">HTML Source Code</label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<!DOCTYPE html><html><body>...</body></html>"
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none resize-none font-mono"
              />
            </div>
          )}

          {/* Filename */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Filename (.html)</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="game.html"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
            />
          </div>

          {/* Photo / Image URL */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Photo / Image URL (Optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/... or image link"
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
                <span className="text-[10px] text-neutral-400 truncate">Image preview active</span>
              </div>
            )}
          </div>

          {error && (
            <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800 p-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title}
              className="bg-white text-black px-5 py-1.5 font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
            >
              {loading ? 'Adding Game...' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
