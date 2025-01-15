require('dotenv').config();

const express = require('express');
const http = require('http');
const allowedHosts = process.env.ALLOWED_HOSTS.split(",");

const socketServer = require('./socket');
const events = require('./events');

const app = express();
app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer || req.headers.host;
    const isAllowed = allowedHosts.some((allowedHost) => origin && origin.startsWith(allowedHost));

    if (isAllowed) {
        next();
    } else {
        console.log(`Blocked request from origin: ${origin}`);
        res.status(403).send('Forbidden: Invalid Host/Origin');
    }
})

const server = http.createServer(app);

app.use(express.json());

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
