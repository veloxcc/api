import storage from './storage';
import logger from '../logger';

const cacheTimeInSeconds = 1800;

const searchByBoxTask = async options => {
  try {
    const data = await storage.getByBox(options);
    return data;
  } catch(err) {
    logger(err);
  }
  return false;
}

const searchByRadiusTask = async options => {
  try {
    const data = await storage.getByRadius(options);
    return data;
  } catch(err) {
    logger(err);
  }
  return false;
}

export const searchByBoxHandler = async (req, res) => {
  const sw = req.query.sw.split(',').map(coord => Number(coord));
  const ne = req.query.ne.split(',').map(coord => Number(coord));
  const response = await searchByBoxTask({ sw, ne });
  const status = response === false ? 400 : 200;

  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send(response || ' ');
}

export const searchByRadiusHandler = async (req, res) => {
  const response = await searchByRadiusTask({
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
