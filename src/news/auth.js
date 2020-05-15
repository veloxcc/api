require('dotenv').config();

import axios from 'axios';
import CryptoJS from 'crypto-js';
import logger from '../logger';

const API_BASE_URL = process.env.API_BASE_URL;
const API_CLIENT_ID = process.env.API_CLIENT_ID;
const API_CLIENT_SECRET = process.env.API_CLIENT_SECRET;
const API_TOKEN = process.env.API_TOKEN;
const SALT = API_TOKEN;

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
});

const revokeToken = async () => {
  const data = {
    refresh_token: API_TOKEN,
    client_id: API_CLIENT_ID,
    client_secret: API_CLIENT_SECRET,
    grant_type: 'revoke_token',
  };

  const config = {
    headers: {'Content-Type': 'application/json' },
  }

  try {
    const response = await http.post('/v3/auth/token', data, config);
    if (response.status === 200 && response.data) return response.data;
  } catch(err) {
    logger(err.message);
  }
  return false;
}

const refreshToken = async () => {
  const data = {
    refresh_token: API_TOKEN,
    client_id: API_CLIENT_ID,
    client_secret: API_CLIENT_SECRET,
    grant_type: 'refresh_token',
  };

  const config = {
    headers: {'Content-Type': 'application/json' },
  }

  try {
    const response = await http.post('/v3/auth/token', data, config);
    if (response.status === 200 && response.data) return response.data;
  } catch(err) {
    if (err.response && err.response.data) {
      const { data } = err.response;
      logger(`${data.errorCode}: ${data.errorMessage}`);
    } else {
      logger(err.message);
    }
  }

  return false;
}

const encryptToken = decryptedToken => {
  try {
    const token = CryptoJS.AES.encrypt(decryptedToken, SALT).toString();
    return token;
  } catch(err) {
    logger(err.message);
  }
  return false;
}

const decryptToken = encryptedToken => {
  try {
    const bytes  = CryptoJS.AES.decrypt(encryptedToken, SALT);
    const token = bytes.toString(CryptoJS.enc.Utf8);
    return token;
  } catch(err) {
    logger(err.message);
  }
  return false;
}

export default {
  revokeToken,
  refreshToken,
  encryptToken,
  decryptToken,
};
