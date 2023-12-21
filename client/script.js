const socket = io('http://localhost:5000');

const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");

let username = prompt('What is your name?');

if (username) {
  appendMessage('You joined to the chat');
  socket.emit('new-user', username);
}

socket.on('chat-message', (data) => {
  appendMessage(data);
})

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = messageInput.value;
  socket.emit('send-chat-message', message);

  messageInput.value = '';
})

function appendMessage(msg) {
  const messageElement = document.createElement('div');
  messageElement.innerText = msg;
  messageContainer.append(messageElement);
}