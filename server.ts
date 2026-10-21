import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';
const gamesDir = path.resolve(__dirname, 'games');
const dataDir = path.resolve(__dirname, 'data');
const chatFile = path.resolve(dataDir, 'chat_messages.json');

// Ensure directories exist
if (!fs.existsSync(gamesDir)) {
  fs.mkdirSync(gamesDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

// Load persisted messages
let chatMessages: ChatMessage[] = [];
try {
  if (fs.existsSync(chatFile)) {
    const raw = fs.readFileSync(chatFile, 'utf-8');
    chatMessages = JSON.parse(raw);
  }
} catch (err) {
  console.warn('Could not read existing chat messages, starting fresh:', err);
  chatMessages = [];
}

function persistChat() {
  try {
    fs.writeFileSync(chatFile, JSON.stringify(chatMessages.slice(-200), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist chat messages:', err);
  }
}

// SSE Clients for real-time live chat
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
      // client likely disconnected
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
  } catch {
    // fallback to filename
  }
  const nameWithoutExt = filename.replace(/\.html$/i, '');
  return nameWithoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static games with permissive headers for iframes
  app.use('/games', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  }, express.static(gamesDir));

  // --- Games API ---
  // Returns all .html games dynamically found in /games folder
  app.get('/api/games', (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(gamesDir)) {
        fs.mkdirSync(gamesDir, { recursive: true });
      }

      const files = fs.readdirSync(gamesDir);
      const htmlFiles = files.filter(f => f.toLowerCase().endsWith('.html'));

      const games = htmlFiles.map(filename => {
        const fullPath = path.join(gamesDir, filename);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          stat = { size: 0, mtimeMs: Date.now() };
        }

        const title = getGameTitle(filename, fullPath);
        return {
          id: filename,
          filename,
          title,
          url: `/games/${encodeURIComponent(filename)}`,
          size: stat.size,
          updatedAt: stat.mtimeMs,
        };
      });

      // Sort by modified time descending (newest games first)
      games.sort((a, b) => b.updatedAt - a.updatedAt);

      res.json({ success: true, games, count: games.length });
    } catch (err: any) {
      console.error('Error listing games:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Upload or add a new .html game
  app.post('/api/games/upload', (req: Request, res: Response) => {
    try {
      const { filename, content } = req.body;
      if (!filename || typeof filename !== 'string') {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }
      if (!content || typeof content !== 'string') {
        res.status(400).json({ success: false, error: 'HTML content is required' });
        return;
      }

      // Sanitize filename to prevent directory traversal
      let safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!safeName.toLowerCase().endsWith('.html')) {
        safeName += '.html';
      }

      const targetPath = path.join(gamesDir, safeName);
      fs.writeFileSync(targetPath, content, 'utf-8');

      const title = getGameTitle(safeName, targetPath);
      const stat = fs.statSync(targetPath);

      const gameObj = {
        id: safeName,
        filename: safeName,
        title,
        url: `/games/${encodeURIComponent(safeName)}`,
        size: stat.size,
        updatedAt: stat.mtimeMs,
      };

      // Notify clients
      broadcastSSE('game_added', gameObj);

      res.json({ success: true, game: gameObj });
    } catch (err: any) {
      console.error('Error saving game:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete a game
  app.delete('/api/games/:filename', (req: Request, res: Response) => {
    try {
      const filename = path.basename(req.params.filename);
      const targetPath = path.join(gamesDir, filename);

      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        broadcastSSE('game_deleted', { filename });
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (err: any) {
      console.error('Error deleting game:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Live Chat API ---
  app.get('/api/chat/messages', (req: Request, res: Response) => {
    res.json({ success: true, messages: chatMessages });
  });

  app.post('/api/chat/message', (req: Request, res: Response) => {
    const { sender, text } = req.body;
    const cleanSender = String(sender || 'Anonymous').trim().slice(0, 24);
    const cleanText = String(text || '').trim().slice(0, 500);

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
    if (chatMessages.length > 300) {
      chatMessages = chatMessages.slice(-300);
    }
    persistChat();

    // Broadcast to SSE clients
    broadcastSSE('chat_message', newMessage);

    res.json({ success: true, message: newMessage });
  });

  // SSE Stream for Live Chat & Game events
  app.get('/api/chat/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    sseClients.set(clientId, { id: clientId, res });

    // Send initial payload with recent messages and online count
    res.write(`event: init\ndata: ${JSON.stringify({
      messages: chatMessages.slice(-100),
      onlineCount: sseClients.size,
    })}\n\n`);

    broadcastOnlineCount();

    // Keepalive ping
    const keepalive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(keepalive);
      sseClients.delete(clientId);
      broadcastOnlineCount();
    });
  });

  app.get('/api/online', (req: Request, res: Response) => {
    res.json({ onlineCount: sseClients.size });
  });

  // --- Dev / Prod Static serving ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[whatthegoy] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
