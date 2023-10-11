const crypto = require("crypto");
const secp256k1 = require("secp256k1");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const { default: BigNumber } = require("bignumber.js");

function addressFromPublicKey(publicKey) {
  const addressBuffer = keccak256(Buffer.from(publicKey));

  return `0x${addressBuffer
    .subarray(addressBuffer.length - 20)
    .toString("hex")}`;
}

function addressFromPrivateKeyHex(privateKeyHex) {
  const privateKey = Buffer.from(privateKeyHex, "hex");
  const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);
  return addressFromPublicKey(publicKey);
}

function generateAddress() {
  const privateKey = crypto.randomBytes(32);
  const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);

  const privateKeyHex = privateKey.toString("hex");
  const address = addressFromPublicKey(publicKey);
  return { privateKey, publicKey, privateKeyHex, address };
}

function uint8ArrayToHex(byteArray) {
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
}

function createMsgFromTransaction(transaction) {
  delete transaction.sig;
  let msg = crypto
    .createHash("sha256")
    .update(JSON.stringify(transaction))
    .digest();
  msg = msg.toString("hex");

  return msg;
}

function sign(data, privateKeyHex) {
  const privateKey = Buffer.from(privateKeyHex, "hex");
  let msg = crypto.createHash("sha256").update(data).digest();

  let sig = secp256k1.ecdsaSign(msg, privateKey);

  msg = msg.toString("hex");

  sig.signature = uint8ArrayToHex(sig.signature);
  return { msg, sig };
}

function isPositiveInteger(num) {
  const parsed = Number(num);
  return Number.isInteger(parsed) && parsed > 0;
}

function recoveryFromSig(sig) {
  const msg = Buffer.from(sig.msg, "hex");
  const signature = hexToUint8Array(sig.sig.signature);
  const recid = sig.sig.recid;

  const recoveredPublicKey = secp256k1
    .ecdsaRecover(signature, recid, msg, false)
    .slice(1);

  return addressFromPublicKey(recoveredPublicKey);
}

function calculateHash(data) {
  data = JSON.stringify(data);
  return crypto.createHash("sha256").update(data).digest("hex");
}
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function getRoot(list) {
  const leaves = list.map((x) => keccak256(JSON.stringify(x)));
  const tree = new MerkleTree(leaves, keccak256);
  const root = tree.getRoot().toString("hex");
  return root;
}

function isAddress(address) {
  if (toChecksumAddress(address) != address) {
    return false;
  }
  return true;
}

function toChecksumAddress(address) {
  if (!/^0x?[0-9a-f]{40}$/i.test(address)) {
    return;
  }
  const addressWithoutPrefix = address.toLowerCase().replace("0x", "");
  const hash = keccak256(addressWithoutPrefix).toString("hex");

  let checksumAddress = "0x";
  for (let i = 0; i < addressWithoutPrefix.length; i++) {
    checksumAddress +=
      parseInt(hash[i], 16) >= 8
        ? addressWithoutPrefix[i].toUpperCase()
        : addressWithoutPrefix[i];
  }

  return checksumAddress;
}

function to64Hex(number) {
  return BigNumber(number).toString(16).padStart(64, "0");
}

module.exports = {
  createMsgFromTransaction,
  addressFromPrivateKeyHex,
  uint8ArrayToHex,
  isPositiveInteger,
  isAddress,
  calculateHash,
  sleep,
  generateAddress,
  sign,
  recoveryFromSig,
  addressFromPublicKey,
  getRoot,
  toChecksumAddress,
  to64Hex,
};
