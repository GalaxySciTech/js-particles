const os = require("os");
const path = require("path");
require("dotenv").config();

const db = process.env.db || "file";

const dbpath = process.env.dbpath || path.join(os.homedir(), ".particles");

const pool = process.env.pool || "https://p2p.particles.digital";

const minerAddress =
  process.env.minerAddress || "0xD7c7c1E83a1d8E30f5Da542F99d7b9bDD896600e";

const isMiner = process.env.isMiner || 1;

module.exports = { db, dbpath, pool, minerAddress, isMiner };
