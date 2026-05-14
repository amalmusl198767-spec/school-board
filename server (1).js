const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');

// Redis client
let redisClient = null;

async function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redisClient = createClient({ url });
    redisClient.on('error', err => console.log('Redis error:', err));
    await redisClient.connect();
    console.log('Redis connected!');
    return redisClient;
  } catch(e) {
    console.log('Redis connection failed:', e.message);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Serve HTML
  if (req.method === 'GET' && req.url === '/') {
    const htmlFile = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlFile)) {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end(fs.readFileSync(htmlFile));
    } else {
      res.writeHead(404); res.end('Page not found');
    }
    return;
  }

  // GET data
  if (req.method === 'GET' && req.url === '/api/data') {
    const redis = await getRedis();
    if (redis) {
      try {
        const data = await redis.get('schoolboard');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(data || '{}');
        return;
      } catch(e) { console.log('Redis get error:', e); }
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{}');
    return;
  }

  // POST data
  if (req.method === 'POST' && req.url === '/api/data') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        JSON.parse(body);
        const redis = await getRedis();
        if (redis) {
          await redis.set('schoolboard', body);
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end('{"ok":true}');
      } catch(e) {
        res.writeHead(400); res.end('Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));

// Connect Redis on startup
getRedis();
