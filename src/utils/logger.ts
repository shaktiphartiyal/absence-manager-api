import { createLogger, format, transports } from 'winston';
import { Config } from '../config/config';
const { Console } = transports;
const Logger = createLogger({
   level: Config.logLevel,
});
const errorStackFormat = format((info) => {
   if (info.stack) {
      console.log(info.stack);
      return false;
    }
      return info;
   });
const consoleTransport = new Console({
format: format.combine(
    format.colorize(),
    format.simple(),
    errorStackFormat(),
),
});
Logger.add(consoleTransport);
export default Logger;