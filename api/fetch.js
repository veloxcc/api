const fetch = require('../src/fetch');
const storage = require('../src/storage');
const logger = require('../src/logger');
const cacheTimeInSeconds = 1800;

module.exports = async (req, res) => {
  const response = await asyncTask(res);
  const status = response === false ? 400 : 200;
  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send();
}

const asyncTask = async res => {
  try {
    const data = await fetch();
    if (data) {
      const { items, rateLimit } = data;
      res.setHeader('velox-count', rateLimit.count);
      await storage.save(items);
    }
    return true;
  } catch(err) {
    if (err.response) {
      const { data: errorData } = err.response;
      logger(err && `Error: ${err.message}${ errorData ? `, ${errorData.errorMessage}` : ''}`);
    } else {
      logger(err.message);
    }
    return false;
  }
}
