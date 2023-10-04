const { Mutex } = require("async-mutex");
const mutex = new Mutex();

const lock = async (key, callback, ...args) => {
  const release = await mutex.acquire(key);
  try {
    return await callback(...args);
  } finally {
    release();
  }
};

module.exports = lock;
