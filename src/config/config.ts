export const Config = {
  serverPort : 8080,
  jwtKey : "SOME_KEY",
  jwtExpiry : '3d',
  logLevel: 'debug',
  csvPath: '/some/path/to/storage',
  emailUser: 'mailid@email.com',
  emailPassword: 'SuperSecurePassword',
  emaiHost: 'mail.example.com',
  emailPort: 650,
  emailSecure: true,
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
