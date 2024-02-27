import app from './server';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Config } from './config/config';
import { intializeDB } from './db';
import Logger from './utils/logger';

intializeDB();

const httpsOptions = {
    key: fs.readFileSync(`${__dirname}/../certs/key.pem`),
    cert: fs.readFileSync(`${__dirname}/../certs/cert.pem`)
  };
const server = https.createServer(httpsOptions, app);
// const insecureServer = http.createServer(app);


server.listen(Config.serverPort, () => 
{
    Logger.info(`Application listening on https://0.0.0.0:${Config.serverPort}`);
});