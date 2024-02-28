export const Config = {
  serverPort : 8080,
  jwtKey : "JWT KEY",
  jwtExpiry : '3d',
  dbLogging: false,
  csvPath: 'CSV FOLDER PATH',
  emailUser: 'mail@example.com',
  emailPassword: 'SuperSecurePassword',
  emaiHost: 'mail.example.com',
  emailPort: 587,
  emailSecure: false,
  db: {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "password",
    database: "absencemanager",
    cache: false,
    logging: false,
  }
};
