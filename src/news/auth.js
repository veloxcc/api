require('dotenv').config();

const axios = require('axios'); 
const CryptoJS = require('crypto-js');
const logger = require('../logger');

const API_BASE_URL = process.env.API_BASE_URL;
const API_CLIENT_ID = process.env.API_CLIENT_ID;
const API_CLIENT_SECRET = process.env.API_CLIENT_SECRET;
const API_TOKEN = process.env.API_TOKEN;
const SALT = API_TOKEN;

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
});

module.exports.revokeToken = async () => {
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

module.exports.refreshToken = async () => {
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

module.exports.encryptToken = decryptedToken => {
  try {
    const token = CryptoJS.AES.encrypt(decryptedToken, SALT).toString();
    return token;
  } catch(err) {
    logger(err.message);
  }
  return false;
}

module.exports.decryptToken = encryptedToken => {
  try {
    const bytes  = CryptoJS.AES.decrypt(encryptedToken, SALT);
    const token = bytes.toString(CryptoJS.enc.Utf8);
    return token;
  } catch(err) {
    logger(err.message);
  }
  return false;
}
