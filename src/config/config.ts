export const Config = {
  serverPort : 8080,
  jwtKey : "THE_KEY",
  jwtExpiry : '3d',
  db: {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "password",
    database: "absencemanager",
    cache: false,
    logging: false,
  },
  csvPath: 'THE_STORAGE_PATH',
  emailUser: 'email@example.com',
  emailPassword: 'THEPASSWORD',
  emaiHost: 'mail.example.com',
  emailPort: 587,
  emailSecure: true
};
