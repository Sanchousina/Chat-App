const socket = io('http://localhost:5000');
import { generateAesKeyFromSmallKey, encryptWithAes, decryptWithAes } from "./aes.js";
import { generateRandomSecret } from "./util.js";

const messageForm = document.getElementById("send-container");
const sendMessageBtn = document.getElementById("send-button");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const usernameInput = document.getElementById("username-input");
const joinChatBtn = document.getElementById("join-chat-button");

let privateKeyAES;
let p, g;

function appendMessage(msg) {
  const messageElement = document.createElement('div');
  messageElement.innerText = msg;
  messageContainer.append(messageElement);
}

async function submitMessage(e) {
  e.preventDefault();

  console.log(privateKeyAES);

  if (privateKeyAES) {
    const message = messageInput.value;
  
    appendMessage(`You: ${message}`);
  
    const aesCiphertext = await encryptWithAes(message, privateKeyAES);
    console.log('AES Ciphertext:', aesCiphertext);
  
    socket.emit('send-chat-message', aesCiphertext);
  
    messageInput.value = '';
  }
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

    const secret = generateRandomSecret();
    console.log(`Secret for ${username}: ${secret}`);

    socket.emit('request-public-variables');

    socket.on('receive-public-variables', data => {
      p = data.p, g = data.g;

      console.log('P: ', p);
      console.log('G: ', g);
    })

    socket.on('new-user-joined', (name) => {
      appendMessage(`${name} joined`);
    })

    socket.on('start-key-exchange', () => {
      const publicKey = g**secret%p;
      socket.emit('exchange-public-key', publicKey);
    });
    
    socket.on('receive-public-key', async data => {
      if (data.groupChat) {
        // if 3 or more users:

        if (!data.endOfRound) {
          const publicKey = data.key**secret%p;
          socket.emit('exchange-public-key', publicKey);
        } else {
          const privateKey = data.key**secret%p;
          console.log(`Private key for ${username}: ${privateKey}`);

          privateKeyAES = await generateAesKeyFromSmallKey(privateKey);
        }

      } else {
        // if 2 users:

        const privateKey = data.key**secret%p;
        console.log(`Private key for ${username}: ${privateKey}`);

        privateKeyAES = await generateAesKeyFromSmallKey(privateKey);
  
        if (!data.endOfRound) {
          const publicKey = g**secret%p;
          socket.emit('exchange-public-key', publicKey);
        }
      }
    })

    sendMessageBtn.addEventListener('click', (e) => submitMessage(e));

    socket.on('chat-message', async (data) => {
      console.log('Encrypted message: ', data.message);
      const decryptedText = await decryptWithAes(data.message, privateKeyAES);
      appendMessage(`${data.username}: ${decryptedText}`);
    })
    
    socket.on('user-disconnected', (username) => {
      appendMessage(`${username} left chat`);
    })
  } else {
    alert('Enter your name to join chat');
    sendMessageBtn.disabled = true;
  }
}