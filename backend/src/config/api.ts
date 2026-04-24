import axios from 'axios';
import http from 'http';
import https from 'https';

const api = axios.create({
  timeout: 30000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

export { api };
