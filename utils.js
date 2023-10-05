const crypto = require("crypto");
const secp256k1 = require("secp256k1");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

function addressFromPublicKey(publicKey) {
  const addressBuffer = keccak256(Buffer.from(publicKey));

  return `0x${addressBuffer
    .subarray(addressBuffer.length - 20)
    .toString("hex")}`;
}

function generateAddress() {
  const privateKey = crypto.randomBytes(32);
  const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);

  const privateKeyHex = privateKey.toString("hex");
  const address = addressFromPublicKey(publicKey);
  return { privateKey, publicKey, privateKeyHex, address };
}

function sign(data, privateKey) {
  const msg = crypto.createHash("sha256").update(data).digest();

  let sig = secp256k1.ecdsaSign(msg, privateKey);
  return { msg, sig };
}

function recoveryFromSig(sig) {
  const msg = sig.msg;
  const signature = sig.sig.signature;
  const recid = sig.sig.recid;

  const recoveredPublicKey = secp256k1
    .ecdsaRecover(signature, recid, msg, false)
    .slice(1);

  return addressFromPublicKey(recoveredPublicKey);
}

function calculateHash(index, previousHash, data, timestamp, nonce) {
  return crypto
    .createHash("sha256")
    .update(index + previousHash + timestamp + JSON.stringify(data) + nonce)
    .digest("hex");
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

function toChecksumAddress(address) {
  address = address.toLowerCase().replace("0x", "");
  const hash = keccak256(address).toString("hex");
  return '0x' + address.split('').map((char, index) => parseInt(hash[index], 16) >= 8 ? char.toUpperCase() : char).join('');
}

module.exports = {
  calculateHash,
  sleep,
  generateAddress,
  sign,
  recoveryFromSig,
  addressFromPublicKey,
  getRoot,
  toChecksumAddress,
};
