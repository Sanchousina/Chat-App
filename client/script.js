const socket = io('http://localhost:5000');

const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");

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