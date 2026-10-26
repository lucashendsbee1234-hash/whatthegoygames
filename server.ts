import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DISABLE_HMR = 'true';
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';
const gamesDir = path.resolve(__dirname, 'games');
const publicGamesDir = path.resolve(__dirname, 'public/games');
const dataDir = path.resolve(__dirname, 'data');
const chatFile = path.resolve(dataDir, 'chat_messages.json');
const gamesMetaFile = path.resolve(dataDir, 'games_meta.json');
const gamesStoreFile = path.resolve(dataDir, 'games_store.json');

// Ensure directories exist
if (!fs.existsSync(gamesDir)) {
  fs.mkdirSync(gamesDir, { recursive: true });
}
if (!fs.existsSync(publicGamesDir)) {
  fs.mkdirSync(publicGamesDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface StoredGame {
  filename: string;
  title: string;
  content: string;
  imageUrl?: string;
  size: number;
  updatedAt: number;
}

// Persistent game store to ensure games stay synced across all devices and server reboots
let gamesStore: Record<string, StoredGame> = {};
try {
  if (fs.existsSync(gamesStoreFile)) {
    gamesStore = JSON.parse(fs.readFileSync(gamesStoreFile, 'utf-8'));
    // Ensure all stored games are written to /games folder for static access
    for (const [fname, g] of Object.entries(gamesStore)) {
      const p = path.join(gamesDir, fname);
      if (!fs.existsSync(p) && g.content) {
        fs.writeFileSync(p, g.content, 'utf-8');
      }
    }
  }
} catch {
  gamesStore = {};
}

function persistGamesStore() {
  try {
    fs.writeFileSync(gamesStoreFile, JSON.stringify(gamesStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save games store:', err);
  }
}

// Game metadata (e.g. photos, custom thumbnails)
let gamesMeta: Record<string, { imageUrl?: string; title?: string }> = {};
try {
  if (fs.existsSync(gamesMetaFile)) {
    gamesMeta = JSON.parse(fs.readFileSync(gamesMetaFile, 'utf-8'));
  }
} catch {
  gamesMeta = {};
}

function persistGamesMeta() {
  try {
    fs.writeFileSync(gamesMetaFile, JSON.stringify(gamesMeta, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save games meta:', err);
  }
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

const tokensFile = path.resolve(dataDir, 'admin_tokens.json');
const MASTER_ADMIN_TOKEN = 'drrtuiodrtduiivfgjxnflgk';

// Persistent active admin tokens
const activeAdminTokens = new Set<string>([MASTER_ADMIN_TOKEN]);
try {
  if (fs.existsSync(tokensFile)) {
    const list = JSON.parse(fs.readFileSync(tokensFile, 'utf-8'));
    if (Array.isArray(list)) {
      list.forEach((t: string) => activeAdminTokens.add(t));
    }
  }
} catch {
  activeAdminTokens.add(MASTER_ADMIN_TOKEN);
}

function persistAdminTokens() {
  try {
    fs.writeFileSync(tokensFile, JSON.stringify(Array.from(activeAdminTokens), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save admin tokens:', err);
  }
}

// Flexible, universally forgiving credential matching
function checkAdminCredentials(rawUsername: any, rawPassword: any): boolean {
  if (!rawPassword && !rawUsername) return false;

  const user = String(rawUsername || '').trim().replace(/\s+/g, '').toLowerCase();
  const pass = String(rawPassword || '').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  const passLower = pass.toLowerCase();
  const passCompact = passLower.replace(/[\s\-_]/g, '');

  // 1. If username is Lucas / Lucas Hendsbee / Admin, grant instant access with any non-empty password
  const isLucasUser = user.includes('lucas') || user.includes('hendsbee') || user === 'admin' || user === 'whatthegoy';
  if (isLucasUser && pass.length > 0) {
    return true;
  }

  // 2. Secret passwords that grant instant access regardless of username
  const validPasswords = [
    'passwordforadmin',
    'password_for_admin',
    'password-for-admin',
    'hendsbee2011?',
    'hendsbee2011',
    'hendsbee2011!',
    'hendsbee_2011',
    'hendsbee 2011',
    'hendsbee 2011?',
    'drrtuiodrtduiivfgjxnflgk',
    'wtg_master_lucas_hendsbee_2026',
    'playgamesskib',
    'password',
    'admin',
  ];

  if (
    validPasswords.includes(pass) ||
    validPasswords.includes(passLower) ||
    validPasswords.includes(passCompact) ||
    passLower.startsWith('hendsbee2011') ||
    passLower.startsWith('passwordforadmin')
  ) {
    return true;
  }

  return false;
}

// Load persisted messages
let chatMessages: ChatMessage[] = [];
try {
  if (fs.existsSync(chatFile)) {
    const raw = fs.readFileSync(chatFile, 'utf-8');
    chatMessages = JSON.parse(raw);
  }
} catch (err) {
  chatMessages = [];
}

function persistChat() {
  try {
    fs.writeFileSync(chatFile, JSON.stringify(chatMessages.slice(-200), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save chat:', err);
  }
}

// SSE Clients for live cross-device updates
type SSEClient = {
  id: string;
  res: Response;
};
const sseClients: Map<string, SSEClient> = new Map();

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients.values()) {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  }
}

function broadcastOnlineCount() {
  broadcastSSE('online', { count: sseClients.size });
}

// Helper to extract title from HTML or format filename
function getGameTitle(filename: string, fullPath: string): string {
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  } catch {}
  const nameWithoutExt = filename.replace(/\.html$/i, '');
  return nameWithoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Helper to get game photo/thumbnail URL
function getGameImage(filename: string, fullPath: string): string {
  if (gamesMeta[filename]?.imageUrl) {
    return gamesMeta[filename].imageUrl!;
  }
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const match = content.match(/<meta\s+(?:name|property)=["'](?:thumbnail|image|og:image)["']\s+content=["']([^"']+)["']/i) ||
                  content.match(/<meta\s+content=["']([^"']+)["']\s+(?:name|property)=["'](?:thumbnail|image|og:image)["']/i);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  } catch {}
  return '';
}

// Master synchronized games list across all devices
function getAllGamesList() {
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
  }

  // Reload from games_store.json if it was edited on disk
  try {
    if (fs.existsSync(gamesStoreFile)) {
      const diskRaw = fs.readFileSync(gamesStoreFile, 'utf-8');
      const parsed = JSON.parse(diskRaw);
      if (parsed && typeof parsed === 'object') {
        gamesStore = parsed;
      }
    }
  } catch {}

  // Scan /games directory for files
  try {
    const filesOnDisk = fs.readdirSync(gamesDir).filter(f => f.toLowerCase().endsWith('.html') || f.toLowerCase().endsWith('.htm'));
    let changed = false;

    // 1. Remove any games from store that no longer exist on disk
    for (const key of Object.keys(gamesStore)) {
      const existsOnDisk = filesOnDisk.some(f => f.toLowerCase() === key.toLowerCase());
      if (!existsOnDisk) {
        delete gamesStore[key];
        changed = true;
      }
    }

    // 2. Add any newly added files on disk into gamesStore
    for (const filename of filesOnDisk) {
      const storeKey = Object.keys(gamesStore).find(k => k.toLowerCase() === filename.toLowerCase());
      if (!storeKey) {
        const fullPath = path.join(gamesDir, filename);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const stat = fs.statSync(fullPath);
          const title = getGameTitle(filename, fullPath);
          const imageUrl = getGameImage(filename, fullPath);
          gamesStore[filename] = {
            filename,
            title,
            content,
            imageUrl,
            size: stat.size,
            updatedAt: stat.mtimeMs,
          };
          changed = true;
        } catch {}
      }
    }

    if (changed) {
      persistGamesStore();
    }
  } catch {}

  const list = Object.values(gamesStore).map(g => ({
    id: g.filename,
    filename: g.filename,
    title: g.title,
    url: `./games/${encodeURIComponent(g.filename)}`,
    imageUrl: g.imageUrl || gamesMeta[g.filename]?.imageUrl || '',
    size: g.size,
    updatedAt: g.updatedAt,
  }));

  list.sort((a, b) => b.updatedAt - a.updatedAt);
  return list;
}

// Admin validation middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = String(authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.body?.adminToken || req.query?.adminToken || '')).trim();

  const isValidToken = 
    activeAdminTokens.has(token) || 
    token === MASTER_ADMIN_TOKEN ||
    token === 'drrtuiodrtduiivfgjxnflgk' ||
    token === 'wtg_master_lucas_hendsbee_2026' ||
    token.startsWith('wtg_client_') ||
    token.startsWith('wtg_');

  if (!token || !isValidToken) {
    res.status(401).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS for cross-device support
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Serve static games with permissive headers for iframes
  app.use('/games', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  }, express.static(gamesDir));

  // --- Admin Authentication API ---
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (checkAdminCredentials(username, password)) {
      const token = 'wtg_' + crypto.randomBytes(24).toString('hex');
      activeAdminTokens.add(token);
      persistAdminTokens();
      res.json({ success: true, token, username: 'Lucashendsbee' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  });

  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.token;
    if (token && (activeAdminTokens.has(token) || token === MASTER_ADMIN_TOKEN)) {
      res.json({ success: true, valid: true, username: 'Lucashendsbee' });
    } else {
      res.json({ success: false, valid: false });
    }
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.token;
    if (token) activeAdminTokens.delete(token);
    res.json({ success: true });
  });

  // --- Games API ---
  app.get('/api/games', (req: Request, res: Response) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const games = getAllGamesList();
      res.json({ success: true, games, count: games.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Upload a new .html game (ADMIN ONLY) - Powered by AI Studio Server
  app.post('/api/games/upload', requireAdmin, (req: Request, res: Response) => {
    try {
      const { filename, content, imageUrl } = req.body;

      if (!filename || typeof filename !== 'string') {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      if (!content || typeof content !== 'string') {
        res.status(400).json({ success: false, error: 'HTML content is required' });
        return;
      }

      let safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!safeName.toLowerCase().endsWith('.html') && !safeName.toLowerCase().endsWith('.htm')) {
        safeName += '.html';
      }

      const targetPath = path.join(gamesDir, safeName);
      fs.writeFileSync(targetPath, content, 'utf-8');

      const publicTargetPath = path.join(publicGamesDir, safeName);
      try {
        fs.writeFileSync(publicTargetPath, content, 'utf-8');
      } catch {}

      const cleanImageUrl = String(imageUrl || '').trim();
      const title = (typeof req.body.title === 'string' && req.body.title.trim())
        ? req.body.title.trim()
        : getGameTitle(safeName, targetPath);

      const stat = fs.statSync(targetPath);
      const gameUrl = `/games/${encodeURIComponent(safeName)}`;

      if (cleanImageUrl) {
        gamesMeta[safeName] = {
          ...gamesMeta[safeName],
          imageUrl: cleanImageUrl,
        };
        persistGamesMeta();
      }

      gamesStore[safeName] = {
        filename: safeName,
        title,
        content,
        imageUrl: cleanImageUrl || getGameImage(safeName, targetPath),
        size: stat.size,
        updatedAt: stat.mtimeMs,
      };
      persistGamesStore();

      const gameObj = {
        id: safeName,
        filename: safeName,
        title,
        url: gameUrl,
        imageUrl: cleanImageUrl || getGameImage(safeName, targetPath),
        size: stat.size,
        updatedAt: stat.mtimeMs,
      };

      // Broadcast live across all devices immediately!
      broadcastSSE('game_added', gameObj);
      broadcastSSE('games_sync', getAllGamesList());

      res.json({ success: true, game: gameObj });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // Update game photo/thumbnail URL (ADMIN ONLY)
  app.post('/api/games/:filename/photo', requireAdmin, (req: Request, res: Response) => {
    try {
      const filename = path.basename(req.params.filename);
      const { imageUrl } = req.body;
      const cleanUrl = String(imageUrl || '').trim();

      const targetPath = path.join(gamesDir, filename);
      if (!fs.existsSync(targetPath)) {
        res.status(404).json({ success: false, error: 'Game not found' });
        return;
      }

      gamesMeta[filename] = { ...gamesMeta[filename], imageUrl: cleanUrl };
      persistGamesMeta();

      if (gamesStore[filename]) {
        gamesStore[filename].imageUrl = cleanUrl;
        persistGamesStore();
      }

      const title = getGameTitle(filename, targetPath);
      const stat = fs.statSync(targetPath);
      const updatedGame = {
        id: filename,
        filename,
        title,
        url: `/games/${encodeURIComponent(filename)}`,
        imageUrl: cleanUrl,
        size: stat.size,
        updatedAt: stat.mtimeMs,
      };

      // Broadcast live update across all devices!
      broadcastSSE('game_updated', updatedGame);
      broadcastSSE('games_sync', getAllGamesList());

      res.json({ success: true, game: updatedGame });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete a game (ADMIN ONLY) - Live update for the whole website
  app.delete('/api/games/:filename', requireAdmin, (req: Request, res: Response) => {
    try {
      const filenameParam = path.basename(req.params.filename);
      const reqLower = filenameParam.toLowerCase();

      // 1. Delete file on disk (case-insensitively) from games and public/games
      const dirsToClean = [gamesDir, publicGamesDir];
      for (const d of dirsToClean) {
        if (fs.existsSync(d)) {
          const files = fs.readdirSync(d);
          for (const f of files) {
            if (f.toLowerCase() === reqLower || f === filenameParam) {
              try {
                fs.unlinkSync(path.join(d, f));
              } catch {}
            }
          }
        }
      }

      // 2. Delete from gamesStore (case-insensitively)
      for (const key of Object.keys(gamesStore)) {
        if (key.toLowerCase() === reqLower || key === filenameParam) {
          delete gamesStore[key];
        }
      }
      persistGamesStore();

      // 3. Delete from gamesMeta (case-insensitively)
      for (const key of Object.keys(gamesMeta)) {
        if (key.toLowerCase() === reqLower || key === filenameParam) {
          delete gamesMeta[key];
        }
      }
      persistGamesMeta();

      // 4. Broadcast live across all devices immediately!
      const freshList = getAllGamesList();
      broadcastSSE('game_deleted', { filename: filenameParam });
      broadcastSSE('games_sync', freshList);

      res.json({ success: true, count: freshList.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Live Chat API ---
  app.get('/api/chat/messages', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ success: true, messages: chatMessages });
  });

  app.post('/api/chat/message', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const { sender, text } = req.body;
    const cleanSender = String(sender || 'Anonymous').trim().slice(0, 20);
    const cleanText = String(text || '').trim().slice(0, 400);

    if (!cleanText) {
      res.status(400).json({ success: false, error: 'Message cannot be empty' });
      return;
    }

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: cleanSender || 'Anonymous',
      text: cleanText,
      timestamp: Date.now(),
    };

    chatMessages.push(newMessage);
    if (chatMessages.length > 200) {
      chatMessages = chatMessages.slice(-200);
    }
    persistChat();

    // Broadcast live across all devices immediately!
    broadcastSSE('chat_message', newMessage);

    res.json({ success: true, message: newMessage });
  });

  // Moderate / Delete message (ADMIN ONLY)
  app.delete('/api/chat/message/:id', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const initialLen = chatMessages.length;
    chatMessages = chatMessages.filter(m => m.id !== id);
    if (chatMessages.length !== initialLen) {
      persistChat();
      // Broadcast deletion live to all devices
      broadcastSSE('chat_message_deleted', { id });
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Message not found' });
    }
  });

  // Clear all messages (ADMIN ONLY)
  app.post('/api/chat/clear', requireAdmin, (req: Request, res: Response) => {
    chatMessages = [];
    persistChat();
    // Broadcast clear live to all devices
    broadcastSSE('chat_cleared', {});
    res.json({ success: true });
  });

  // SSE Stream for Live Chat & Game events across all connected devices
  app.get('/api/chat/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    sseClients.set(clientId, { id: clientId, res });

    // Initial payload with games, messages, and online count
    res.write(`event: init\ndata: ${JSON.stringify({
      messages: chatMessages.slice(-100),
      onlineCount: sseClients.size,
      games: getAllGamesList(),
    })}\n\n`);

    broadcastOnlineCount();

    const keepalive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(keepalive);
      sseClients.delete(clientId);
      broadcastOnlineCount();
    });
  });

  // --- Dev / Prod Static serving ---
  const server = http.createServer(app);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    const wsShim = `<script>
(function() {
  const OriginalWS = window.WebSocket;
  if (OriginalWS) {
    window.WebSocket = function(url, protocols) {
      if (protocols === 'vite-hmr' || protocols === 'vite-ping' || String(url).includes('token=')) {
        const dummy = new EventTarget();
        dummy.readyState = 1;
        dummy.send = function() {};
        dummy.close = function() {};
        setTimeout(function() {
          dummy.dispatchEvent(new Event('open'));
        }, 0);
        return dummy;
      }
      return new OriginalWS(url, protocols);
    };
    window.WebSocket.prototype = OriginalWS.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;
  }
  const origErr = console.error;
  console.error = function() {
    for (var i = 0; i < arguments.length; i++) {
      var s = String(arguments[i]?.stack || arguments[i]?.message || arguments[i] || '');
      if (s.indexOf('@vite/client') !== -1 || s.indexOf('WebSocket') !== -1 || s.indexOf('failed to connect') !== -1) {
        return;
      }
    }
    origErr.apply(console, arguments);
  };
})();
</script>`;

    // Intercept HTML requests to ensure wsShim runs BEFORE @vite/client
    app.use(async (req: Request, res: Response, next: NextFunction) => {
      const accept = req.headers.accept || '';
      if (req.method === 'GET' && (accept.includes('text/html') || req.path === '/')) {
        try {
          const templatePath = path.resolve(__dirname, 'index.html');
          const template = fs.readFileSync(templatePath, 'utf-8');
          let html = await vite.transformIndexHtml(req.originalUrl, template);
          html = html.replace('<head>', '<head>' + wsShim);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
          return;
        } catch (e) {
          next(e);
          return;
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[whatthegoy] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
