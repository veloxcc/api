const storage = require('../../src/water-stations/storage');
const logger = require('../../src/logger');
const cacheTimeInSeconds = 1800;

module.exports = async (req, res) => {

  const sw = req.query.sw.split(',').map(coord => Number(coord));
  const ne = req.query.ne.split(',').map(coord => Number(coord));
  const response = await asyncTask({ sw, ne });
  const status = response === false ? 400 : 200;

  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send(response || ' ');
}

const asyncTask = async options => {
  try {
    const data = await storage.getByBox(options);
    return data;
  } catch(err) {
    logger(err);
  }
  return false;
}
