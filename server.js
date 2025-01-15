require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const allowedOrigins = process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(",") || '*';

const socketServer = require('./socket');
const events = require('./events');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'] }));

// Initialize Socket.IO server
socketServer.initialize(server);

// Webhook Endpoint
app.post('/api/webhook/:eventName', events.webhookEventWithData);
app.post('/api/webhook/:eventName/:roomId', events.webhookToRoomWithData);

// Event without data
app.get('/api/socket/:eventName/:roomId', events.socketRoomEventTrigger);
app.get('/api/socket/:eventName', events.socketEventTrigger);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Socket.IO service is running');
});

app.all('*', (req, res) => {
    res.send('Invalid route');
});

// Start the server
const PORT = process.env.PORT || 1243;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
