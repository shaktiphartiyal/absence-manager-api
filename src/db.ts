import Logger from './utils/logger';
import { AppDataSource } from "./data-source";
export async function intializeDB(): Promise<void> {
  AppDataSource.initialize()
  .then(() => {
    Logger.info('Database successfully initialized');
  })
  .catch((error) => console.log(error))
}