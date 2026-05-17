const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = '/tmp/schoolboard_data.json';

function getData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return fs.readFileSync(DATA_FILE, 'utf8');
    }
  } catch(e) {}
  return '{}';
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, data, 'utf8');
    return true;
  } catch(e) {
    console.log('Save error:', e);
    return false;
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

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

  if (req.method === 'GET' && req.url === '/api/data') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(getData());
    return;
  }

  if (req.method === 'POST' && req.url === '/api/data') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        JSON.parse(body);
        saveData(body);
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
