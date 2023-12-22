const socket = io('http://localhost:5000');

const messageForm = document.getElementById("send-container");
const sendMessageBtn = document.getElementById("send-button");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const usernameInput = document.getElementById("username-input");
const joinChatBtn = document.getElementById("join-chat-button");

function appendMessage(msg) {
  const messageElement = document.createElement('div');
  messageElement.innerText = msg;
  messageContainer.append(messageElement);
}

function submitMessage(e) {
  e.preventDefault();

  const message = messageInput.value;

  appendMessage(`You: ${message}`);

  socket.emit('send-chat-message', message);

  messageInput.value = '';
}

joinChatBtn.addEventListener('click', (e) => main(e));

function main(e) {
  e.preventDefault();
  const username = usernameInput.value;

  if (username) {
    sendMessageBtn.disabled = false;
    joinChatBtn.disabled = true;

    appendMessage('You joined to the chat');
    socket.emit('new-user', username);

    let p, g;

    const secret = Math.floor(Math.random() * 9) + 1;
    console.log(`Secret for ${username}: ${secret}`);

    socket.emit('request-public-variables');

    socket.on('receive-public-variables', data => {
      p = data.p, g = data.g;

      console.log('P: ', p);
      console.log('G: ', g);

      // const publicKey = g**secret%p;
      // console.log(`Public key for ${username}: ${publicKey}`);
      // socket.emit('exchange-public-key', publicKey);
    })

    sendMessageBtn.addEventListener('click', (e) => submitMessage(e));

    socket.on('new-user-joined', (name) => {
      appendMessage(`${name} joined`);

      // const publicKey = g**secret%p;
      // console.log(`Public key for ${username}: ${publicKey}`);
      // socket.emit('exchange-public-key', publicKey);
    })

    socket.on('start-key-exchange', () => {
      const publicKey = g**secret%p;
      console.log(`Public key for ${username}: ${publicKey}`);
      socket.emit('exchange-public-key', publicKey);
    });
    
    socket.on('receive-public-key', data => {
      if (data.groupChat) {
        // if 3 and more users:

        if (!data.endOfRound) {
          const publicKey = data.key**secret%p;
          console.log(`Public key for ${username}: ${publicKey}`);
          socket.emit('exchange-public-key', publicKey);
        } else {
          const privateKey = data.key**secret%p;
          console.log(`Private key for ${username}: ${privateKey}`);
        }

      } else {
        // if 2 users:

        const privateKey = data.key**secret%p;
        console.log(`Private key for ${username}: ${privateKey}`);
  
        if (!data.endOfRound) {
          const publicKey = g**secret%p;
          socket.emit('exchange-public-key', publicKey);
        }
      }
    })

    socket.on('chat-message', (data) => {
      appendMessage(`${data.username}: ${data.message}`);
    })
    
    socket.on('user-disconnected', (username) => {
      appendMessage(`${username} left chat`);
    })
  } else {
    alert('Enter your name to join chat');
    sendMessageBtn.disabled = true;
  }
}