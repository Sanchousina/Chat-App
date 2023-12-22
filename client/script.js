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

    const secret = Math.floor(Math.random() * 9) + 1;
    console.log(`Secret for ${username}: ${secret}`);

    socket.emit('request-public-variables');

    socket.on('receive-public-variables', data => {
      const {p, g} = data;
      console.log('P: ', p);
      console.log('G: ', g);
    })

    sendMessageBtn.addEventListener('click', (e) => submitMessage(e));

    socket.on('new-user-joined', (name) => {
      appendMessage(`${name} joined`);
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