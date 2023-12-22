const socket = io('http://localhost:5000');

const messageForm = document.getElementById("send-container");
const sendMessageBtn = document.getElementById("send-button");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const usernameInput = document.getElementById("username-input");
const joinChatBtn = document.getElementById("join-chat-button");

let privateKeyAES;

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
    console.log('AES Ciphertext with CBC:', aesCiphertext);
  
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

    let p, g;
    //let privateKeyAES;

    const secret = Math.floor(Math.random() * 9) + 1;
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
      //console.log(`Public key for ${username}: ${publicKey}`);
      socket.emit('exchange-public-key', publicKey);
    });
    
    socket.on('receive-public-key', async data => {
      if (data.groupChat) {
        // if 3 or more users:

        if (!data.endOfRound) {
          const publicKey = data.key**secret%p;
          //console.log(`Public key for ${username}: ${publicKey}`);
          socket.emit('exchange-public-key', publicKey);
        } else {
          const privateKey = data.key**secret%p;
          console.log(`Private key for ${username}: ${privateKey}`);

          privateKeyAES = await generateAesKeyFromSmallKey(privateKey);
          console.log(`Private AES key for ${username}: ${privateKeyAES}`);
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

async function generateAesKeyFromSmallKey(smallKey) {
  // Convert the small key to a Uint8Array
  const smallKeyArray = new Uint8Array([smallKey]);

  // Use SHA-256 hash to derive a 32-byte key
  const hashBuffer = await crypto.subtle.digest('SHA-256', smallKeyArray);

  // Convert the hash result to a Uint8Array
  const hashArray = new Uint8Array(hashBuffer);

  // Extract the first 16 bytes to get a 16-byte key
  const aesKeyArray = hashArray.slice(0, 16);

  // Import the key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    aesKeyArray,
    { name: 'AES-CBC', length: 128 },
    false,
    ['encrypt', 'decrypt']
  );

  return importedKey;
}

async function encryptWithAes(plaintext, key) {
  const encodedText = new TextEncoder().encode(plaintext);

  // Use a fixed IV of zeros
  const iv = new Uint8Array(16);

  // Encrypt the data in CBC mode
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    encodedText
  );

  // Convert the result to a Uint8Array
  const ciphertextArray = new Uint8Array(ciphertextBuffer);

  return ciphertextArray;
}

async function decryptWithAes(ciphertext, key) {
  // Use a fixed IV of zeros
  const iv = new Uint8Array(16);

  // Decrypt the data in CBC mode
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    ciphertext
  );

  // Convert the result to a Uint8Array
  const decryptedArray = new Uint8Array(decryptedBuffer);

  // Convert the Uint8Array to a string
  const decryptedText = new TextDecoder().decode(decryptedArray);

  return decryptedText;
}