// Install bs58 first: npm install bs58
const bs58 = require('bs58');

// Replace with your base58 private key string
const base58Key = 'aa';

// Decode base58 -> Uint8Array -> regular JS array of integers
const decoded = bs58.decode(base58Key);
const keyArray = Array.from(decoded);

console.log(JSON.stringify(keyArray));

