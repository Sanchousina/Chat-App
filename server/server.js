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

const p = 23;  // g mod p
const g = 5;

const users = {};

io.on('connection', (socket) => {
  console.log('Connected')

  socket.on('new-user', name => {
    users[socket.id] = name;
    
    console.log(users)
    socket.broadcast.emit('new-user-joined', name);
  })

  socket.on('request-public-variables', () => {
    socket.emit('receive-public-variables', {p: p, g: g});
  })

  socket.on('exchange-public-key', publicKey => {
    console.log(`Public key for ${users[socket.id]}: ${publicKey}`)
  })

  socket.on('send-chat-message', (data) => {
    socket.broadcast.emit('chat-message', {
      message: data,
      username: users[socket.id]
    });
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', users[socket.id]);
    delete users[socket.id];
  })
})

server.listen(5000, () => {
  console.log('Server is running');
})