const yargs = require("yargs");
const {
  isAddress,
  sign,
  isPositiveInteger,
  recoveryFromSig,
  uint8ArrayToHex,
} = require("./utils");
const { getBalanceOfAddress, addTransaction } = require("./p2p");
const { walletPrivateKey } = require("./config");

yargs
  .command({
    command: "help",
    describe: "Display the help message",
    handler: () => {
      console.log("This is the help message:");
    },
  })
  .command({
    command: "getBalance",
    describe: "get balance of address",
    builder: {
      address: {
        describe: "Address to get balance for",
        demandOption: true,
        type: "string",
      },
    },
    handler: async (argv) => {
      const address = argv.address;
      if (!isAddress(address)) {
        console.log("Invalid address");
      }
      const wallet = await getBalanceOfAddress(address);
      console.log(wallet?.balance);
    },
  })
  .command({
    command: "sendTransaction",
    describe: "send a transaction",
    builder: {
      to: {
        describe: "Address to send to",
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: "Amount to send",
        demandOption: true,
        type: "number",
      },
    },
    handler: async (argv) => {
      const to = argv.to;
      const amount = argv.amount;

      if (!isAddress(to)) {
        console.error("Invalid to address");
        return;
      }
      if (!isPositiveInteger(amount)) {
        console.error("Invalid amount");
        return;
      }
      const transaction = { to, amount, opcode: "receive" };
      const sig = sign(JSON.stringify(transaction), walletPrivateKey);

      transaction.sig = sig;

      await addTransaction(transaction);

      console.log(transaction);
    },
  })
  .demandCommand(1, "You need at least one command before moving on")
  .help().argv;
