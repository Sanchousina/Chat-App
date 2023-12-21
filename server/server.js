const express = require('express');
const app = express();
const http = require("http");
const socketIO = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: 'http://127.0.0.1:5500'
  }
})

io.on('connection', (socket) => {
  console.log('Connected')
  
  socket.on('send-chat-message', (data) => {
    socket.broadcast.emit('chat-message', data);
  })
})

server.listen(5000, () => {
  console.log('Server is running');
})