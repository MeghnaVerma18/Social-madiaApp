import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/Route.js';
import SocketHandler from './SocketHandler.js';

// Load .env variables
dotenv.config();

// Configuration for __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

// Root route
app.get("/", (req, res) => {
    res.send("Server is up and running on / 🚀");
});

// Routes
app.use('/api', authRoutes);

// HTTP and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// WebSocket
io.on("connection", (socket) => {
    console.log("User connected via WebSocket");
    SocketHandler(socket);
});

// Connect MongoDB and start server
const PORT = process.env.PORT || 6001;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    server.listen(PORT, () => {
        console.log(`✅ Server is running at http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error(`❌ Error connecting to MongoDB: ${err.message}`);
});
