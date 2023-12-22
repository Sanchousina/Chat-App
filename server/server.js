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

let numOfOperations = 0;

io.on('connection', (socket) => {
  console.log('Connected')

  socket.on('new-user', name => {
    users[socket.id] = name;
    
    console.log(users)
    socket.broadcast.emit('new-user-joined', name);
    
    if (Object.entries(users).length > 1) {
      io.to(Object.entries(users)[0][0]).emit('start-key-exchange');
    }
  })

  socket.on('request-public-variables', () => {
    socket.emit('receive-public-variables', {p: p, g: g});
  })

  socket.on('exchange-public-key', publicKey => {
    console.log(`Public key for ${users[socket.id]}: ${publicKey}`);

    numOfOperations += 1;
    console.log('Number of Operation: ', numOfOperations);

    const usersArray = Object.entries(users);
    const senderIndex = usersArray.findIndex(user => user[0] === socket.id);
    const nextRecipient = (senderIndex === usersArray.length - 1) ? 0 : senderIndex + 1;

    console.log(`Next Receipient: ${usersArray[nextRecipient]}`);

    if(usersArray.length === 2 && numOfOperations === 2) {
      io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
        key: publicKey,
        endOfRound: true,
        groupChat: false
      });

      numOfOperations = 0;
    } else if (usersArray.length === 2 && numOfOperations != 2) {
      io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
        key: publicKey,
        endOfRound: false,
        groupChat: false
      });
    } else if (usersArray.length > 2 && numOfOperations != usersArray.length - 1) {
      io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
        key: publicKey,
        endOfRound: false,
        groupChat: true
      });
    } else if (usersArray.length > 2 && numOfOperations === usersArray.length - 1) {
      io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
        key: publicKey,
        endOfRound: true,
        groupChat: true
      });
      numOfOperations = 0;
      // start new round
    }
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