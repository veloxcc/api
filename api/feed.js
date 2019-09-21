const storage = require('../src/storage');
const logger = require('../src/logger');
const cacheTimeInSeconds = 1800;

module.exports = async (req, res) => {
  const response = await asyncTask();
  const status = response === false ? 400 : 200;
  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send(response || '');
}

const asyncTask = async () => {
  try {
    const data = await storage.load();
    return data;
  } catch(err) {
    logger(err);
  }
  return false;
}
