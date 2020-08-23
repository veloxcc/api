require('dotenv').config();

import fetch from './fetch';
import storage from './storage';
import logger from '../logger';

const { FETCH_SECRET } = process.env;

const fetchTask = async res => {
  try {
    const data = await fetch();

    if (data) {
      const { items, rateLimit } = data;
      res.setHeader('velox-count', rateLimit.count);
      await storage.save(items);
    }
    return data;
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

const feedTask = async options => {
  try {
    const data = await storage.load(options);
    return data;
  } catch(err) {
    logger(err);
  }
  return false;
}

const cacheTimeInSeconds = 1800;

export const fetchHandler = async (req, res) => {
  const secret = req.headers['x-velo-x-fetch-secret'];
  if (!secret || secret !== FETCH_SECRET) return res.status(403).send();

  const response = await fetchTask(res);
  const status = response === false ? 400 : 201;
  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).end();
}

export const feedHandler = async (req, res) => {
  const { offset, pageSize } = req.query;

  const response = await feedTask({
    page: parseInt(offset, 10) || null,
    pageSize: parseInt(pageSize, 10) || null,
  });
  const status = response === false ? 400 : 200;

  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send(response || '');
}
