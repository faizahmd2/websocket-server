const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ShareDB = require('sharedb');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const sharedb = new ShareDB();
const connection = sharedb.connect();

const activeDocuments = new Map();

const socketHandlers = {};

function registerHandler(eventKey, callback) {
  socketHandlers[eventKey] = callback;
}

function initializeSocketServer() {
  io.on('connection', (socket) => {
    console.log('New client connected');

    Object.keys(socketHandlers).forEach((eventKey) => {
      socket.on(eventKey, (...args) => {
        socketHandlers[eventKey](socket, ...args);
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

registerHandler('joinDocument', (socket, docId) => {
  console.log(`Client joined document: ${docId}`);

  let doc = activeDocuments.get(docId);
  if (!doc) {
    doc = connection.get('documents', docId);
    activeDocuments.set(docId, doc);

    doc.fetch((err) => {
      if (err) throw err;
      if (!doc.type) {
        doc.create({ content: '' }, 'ot-text');
      }
    });
  }
  
  doc.subscribe((err) => {
    if (err) throw err;

    socket.emit('init', { content: doc.data.content });

    socket.on('submitOp', (op) => {
      doc.submitOp(op);
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client left document: ${docId}`);
    doc.unsubscribe();
  });
});

app.get('/', (req, res) => {
  res.send('Socket.IO server is running');
});

const PORT = process.env.PORT || 1243;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initializeSocketServer();
});