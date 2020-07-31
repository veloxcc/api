require('dotenv').config();

import axios from 'axios';
import logger from '../logger';

axios.defaults.headers.post['Authorization'] = `token ${process.env.CI_TOKEN}`;

const http = axios.create({ timeout: 3000 });
const secret = process.env.PRISMIC_SECRET;

const triggerBuild = async () => {  
  try {
    const response = await http.post(process.env.CI_REQUESTS_ENDPOINT);
  } catch(err) {
    logger(err.message);
    return false;
  }

  return true;
}

export const webhookHandler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send();
  if (!req.body || typeof req.body !== 'object') return res.status(204).send();
  if (req.body.secret !== secret) return res.status(403).send();

  const response = await triggerBuild();
  const status = response === false ? 400 : 200;

  res.status(status).send();
}
