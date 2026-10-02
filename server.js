const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(async () => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  // Attach Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT'],
    },
  });

  // Store globally so API route handlers can broadcast events
  global.io = io;

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Join specific rooms
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`👨‍🍳 [KDS Room] Client ${socket.id} joined restaurant_${restaurantId}`);
      }
    });

    socket.on('join_order', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`📦 [Order Room] Client ${socket.id} joined order_${orderId}`);
      }
    });

    socket.on('join_driver_pool', () => {
      socket.join('driver_pool');
      console.log(`🛵 [Driver Pool] Rider ${socket.id} joined pool`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`
=====================================================
🏔️  QASHQAR FOOD HUB (QFH) - SERVER RUNNING
=====================================================
🌐 App URL:     http://localhost:${PORT}
⚡ Socket.io:   Ready for real-time KDS & Driver dispatches
📞 Hotline:     03426522787 (Rider Dispatch & Support)
🤖 AI Agent:    QFH GPT Search & Support Online
🥘 Dataset:     7 Major Qashqar Valley Establishments & Authentic Menus
=====================================================
    `);
  });
}).catch((ex) => {
  console.error('Fatal Server Error:', ex.stack);
  process.exit(1);
});
