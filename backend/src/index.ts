import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleSockets } from './handlers/socketHandler';

dotenv.config();

const app = express();

const allowedOrigins = true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('Skribbl Clone Server is running!');
});

handleSockets(io);

const PORT = process.env.PORT || 3000 ;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});