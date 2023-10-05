const os = require("os");
const path = require("path");
const { toChecksumAddress } = require("./utils");
require("dotenv").config();

const db = process.env.db || "file";

const dbpath = process.env.dbpath || path.join(os.homedir(), ".particles");

const pool = process.env.pool || "https://p2p.particles.digital";

const minerAddress =
  toChecksumAddress(process.env.minerAddress) || "0x32B073a5aB171961B7fbF7D379d0285965FcFA43";

const isMiner = process.env.isMiner || 1;

module.exports = { db, dbpath, pool, minerAddress, isMiner };
