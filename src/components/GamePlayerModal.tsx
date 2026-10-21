import React, { useState, useRef } from 'react';
import { X, Maximize2, Minimize2, RotateCcw, ShieldAlert, ExternalLink } from 'lucide-react';

interface Game {
  id: string;
  filename: string;
  title: string;
  url: string;
  size: number;
  updatedAt: number;
}

interface GamePlayerModalProps {
  game: Game;
  onClose: () => void;
  onPanic: () => void;
}

export const GamePlayerModal: React.FC<GamePlayerModalProps> = ({ game, onClose, onPanic }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); // For reloading iframe
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      <div 
        ref={containerRef}
        className={`bg-black border-2 border-white flex flex-col shadow-[6px_6px_0px_0px_#ffffff] transition-all duration-150 ${
          isFullscreen ? 'w-screen h-screen border-none' : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Top bar */}
        <header className="bg-black border-b-2 border-white px-4 py-2 flex items-center justify-between text-white font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-wider uppercase">{game.title}</span>
            <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 border border-neutral-700">
              {game.filename}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Panic button shortcut inside player */}
            <button
              onClick={onPanic}
              className="bg-white text-black font-bold px-2.5 py-1 flex items-center gap-1.5 hover:bg-neutral-300 text-[11px] tracking-wide"
              title="Instant Panic: Switch to Fake Google Doc"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-black" />
              <span>PANIC (ESC)</span>
            </button>

            {/* Reload game */}
            <button
              onClick={() => setKey(prev => prev + 1)}
              className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-white"
              title="Reload Game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Open in new tab */}
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-white"
              title="Open standalone in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-white ml-2"
              title="Close Game"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Game iframe */}
        <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden">
          <iframe
            key={key}
            src={game.url}
            title={game.title}
            className="w-full h-full border-none bg-black"
            allow="autoplay; fullscreen; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          />
        </div>
      </div>
    </div>
  );
};
