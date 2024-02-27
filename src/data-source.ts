import { DataSource } from "typeorm";
import { Config } from "./config/config";

export const AppDataSource = new DataSource({
    "type": Config.db.type as 'mariadb' | 'mysql' | 'postgres',
    "host": Config.db.host,
    "port": Config.db.port,
    "username": Config.db.username,
    "password": Config.db.password,
    "database": Config.db.database,
    "cache": false,
    synchronize: false,
    logging: Config.db.logging
})