const socket = io('http://localhost:5000');

const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");

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

function main() {
  const username = prompt('What is your name?');

  if (username) {
    appendMessage('You joined to the chat');
    console.log(username);
    socket.emit('new-user', username);

    messageForm.addEventListener('submit', (e) => submitMessage(e));

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
    messageForm.addEventListener('submit', () => {
      alert('Enter your name to join chat');
    });
  }
}

main();