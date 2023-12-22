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
let startExchangeUserIndex = 0;

io.on('connection', (socket) => {
  console.log('Connected')

  socket.on('new-user', name => {
    users[socket.id] = name;
  
    socket.broadcast.emit('new-user-joined', name);
    
    let usersArr = Object.entries(users);
    if (usersArr.length > 1) {
      io.to(usersArr[startExchangeUserIndex][0]).emit('start-key-exchange');
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

    console.log(`Next Receipient: ${usersArray[nextRecipient]} \n`);

    // if(usersArray.length === 2 && numOfOperations === 2) {
    //   io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
    //     key: publicKey,
    //     endOfRound: true,
    //     groupChat: false
    //   });

    //   numOfOperations = 0;
    // } else if (usersArray.length === 2 && numOfOperations != 2) {
    //   io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
    //     key: publicKey,
    //     endOfRound: false,
    //     groupChat: false
    //   });
    // } else if (usersArray.length > 2 && numOfOperations != usersArray.length - 1) {
    //   io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
    //     key: publicKey,
    //     endOfRound: false,
    //     groupChat: true
    //   });
    // } else if (usersArray.length > 2 && numOfOperations === usersArray.length - 1) {
    //   io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
    //     key: publicKey,
    //     endOfRound: true,
    //     groupChat: true
    //   });
      
    //   numOfOperations = 0;

    //   // start new round
    //   if (nextRecipient != usersArray.length - 2) {
    //     startExchangeUserIndex++;

    //     console.log(`Next start user: ${usersArray[startExchangeUserIndex][1]}`)
    //     io.to(usersArray[startExchangeUserIndex][0]).emit('start-key-exchange');
    //   } else {
    //     console.log('EVERYONE HAS SECRET KEY');
    //     startExchangeUserIndex = 0;
    //   }
    // }

    if (usersArray.length >= 2) {
      const isEndOfRound = (usersArray.length === 2 && numOfOperations === 2) || (usersArray.length > 2 && numOfOperations === usersArray.length - 1);
      const isGroupChat = usersArray.length > 2;

      console.log('isEndOfRound: ', isEndOfRound)
      console.log('isGroupChat: ', isGroupChat)
    
      io.to(usersArray[nextRecipient][0]).emit('receive-public-key', {
        key: publicKey,
        endOfRound: isEndOfRound,
        groupChat: isGroupChat
      });
    
      if (isEndOfRound) {
        numOfOperations = 0;
    
        // Start new round
        if (isGroupChat && nextRecipient !== usersArray.length - 2) {
          startExchangeUserIndex++;
          console.log(`Next start user: ${usersArray[startExchangeUserIndex][1]}`);
          io.to(usersArray[startExchangeUserIndex][0]).emit('start-key-exchange');
        } else if (isGroupChat) {
          console.log('EVERYONE HAS SECRET KEY');
          startExchangeUserIndex = 0;
        }
      }
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