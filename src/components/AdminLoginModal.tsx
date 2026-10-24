import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { verifyCredentialsClientSide } from '../utils/auth';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: (token: string, username: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanPass = password.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
      const cleanUser = username.trim();
      let res: Response | null = null;
      let data: any = null;

      try {
        res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: cleanUser, 
            password: cleanPass 
          }),
        });
        if (res.ok) {
          data = await res.json().catch(() => null);
        }
      } catch {
        // Network error / no backend (GitHub Pages / static host)
      }

      // If backend responded with success
      if (res && res.ok && data?.success) {
        onSuccess(data.token, data.username || 'Admin');
        onClose();
        return;
      }

      // If on GitHub Pages or static hosting where /api/ returned 404 or failed:
      if (!res || res.status === 404 || res.status === 405 || !res.ok) {
        if (verifyCredentialsClientSide(cleanUser, cleanPass)) {
          const clientToken = 'wtg_client_' + Date.now();
          onSuccess(clientToken, 'Lucashendsbee');
          onClose();
          return;
        }
      }

      throw new Error(data?.error || 'Invalid credentials');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-black border-2 border-white w-full max-w-sm text-white shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="border-b-2 border-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-bold text-xs uppercase tracking-wider">Sign In</span>
          </div>
          <button onClick={onClose} className="hover:text-neutral-400 p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white px-2.5 py-1.5 text-xs text-white outline-none"
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
              className="px-3 py-1 border border-neutral-700 text-neutral-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black px-4 py-1 font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
            >
              {loading ? '...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
