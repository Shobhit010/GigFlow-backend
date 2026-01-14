import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "https://gig-flow-nine-jade.vercel.app",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, "")),
];

console.log("Allowed Origins:", allowedOrigins);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Debug Middleware: Log Origin
app.use((req, res, next) => {
  console.log(`[DEBUG] Method: ${req.method}, URL: ${req.url}, Origin: ${req.headers.origin}`);
  next();
});

// Express CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Routes
import authRoutes from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import bidRoutes from './routes/bidRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bids', bidRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io logic
const userSocketMap = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of Object.entries(userSocketMap)) {
      if (socketId === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
  });
});

app.set('io', io);
app.set('userSocketMap', userSocketMap);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
