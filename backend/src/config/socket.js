const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (process.env.NODE_ENV === 'production') {
          const allowed = process.env.CLIENT_URL || '';
          if (!origin || origin === allowed) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        } else {
          callback(null, origin || true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('remote_qr_scan', (data) => {
      if (data && data.room && data.qrData) {
        console.log(`📡 Remote QR received for room ${data.room}: ${data.qrData.slice(0, 40)}`);
        io.to(data.room).emit('remote_qr_received', { qrData: data.qrData });
      }
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
