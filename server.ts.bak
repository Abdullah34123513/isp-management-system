// server.ts - Simple Next.js server without Socket.IO for now
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Simple Next.js server
const app = next({ dev, hostname, port: currentPort });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  require('http').createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .listen(currentPort, hostname, () => {
    console.log(`> Ready on http://${hostname}:${currentPort}`);
  });
});
