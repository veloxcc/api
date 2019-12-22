const storage = require('../../src/water-stations/storage');
const logger = require('../../src/logger');
const cacheTimeInSeconds = 1800;

module.exports = async (req, res) => {
  const response = await asyncTask({
    lat: Number(req.query.lat),
    lng: Number(req.query.lng),
    r: Number(req.query.r),
  });

  const status = response === false ? 400 : 200;
  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send(response || ' ');
}

const asyncTask = async options => {
  try {
    const data = await storage.load(options);
    return data;
  } catch(err) {
    logger(err);
  }
  return false;
}
