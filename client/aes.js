export async function generateAesKeyFromSmallKey(smallKey) {
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

export async function encryptWithAes(plaintext, key) {
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

export async function decryptWithAes(ciphertext, key) {
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