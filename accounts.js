const { default: BigNumber } = require("bignumber.js");
const db = require("./db");
const extendWallet = require("./wallets.json");
const { toChecksumAddress, getRoot } = require("./utils");

async function changeBalance(address, amount) {
  const accounts = await db.find("accounts", { address });
  if (accounts.length == 0 && amount > 0) {
    await db.insert("accounts", [{ address, balance: amount }]);
    return;
  }

  const account = accounts[0];

  account.balance = BigNumber(account.balance).plus(amount).toFixed();

  await db.update("accounts", { address: account.address }, { $set: account });
}

async function getAccounts(address) {
  return await db.find("accounts", { address });
}

async function initAccounts() {
  const accounts = extendWallet.map((item) => {
    item.address = toChecksumAddress(item.address);
    item.balance = item.balance?.toString();
    return item;
  });

  await db.insert("accounts", accounts);
}

async function getStateRoot() {
  const accounts = await getAccounts();
  const stateRoot = getRoot(accounts);
  return stateRoot;
}

async function getBalance(address) {
  address = toChecksumAddress(address);
  const accounts = await db.find("accounts", { address });

  return accounts?.[0] || {};
}

module.exports = {
  changeBalance,
  getAccounts,
  getStateRoot,
  initAccounts,
  getBalance,
};
