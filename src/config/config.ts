export const Config = {
  serverPort : 8080,
  jwtKey : "JWT_KEY",
  jwtExpiry : '3d',
  logLevel: 'debug',
  csvPath: '/some/path/where/csv/file/will_be/stored',
  passwordReset: {
    timeInSecondsBetweenPasswordResets: 120,
    resetUrl: 'http://example.com/reset-password',
    resetTokenValidForSeconds: 600
  },
  email: {
    emailUser: 'admin@example.com',
    emailPassword: 'SuperSecurePassword',
    emaiHost: 'mail.example.com',
    emailPort: 660,
    emailSecure: true,
    mockSending: true
  },
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
  backgroundService: {
    port: 9080
  },
  encryption: {
    secret_key: "ENCRYPTION_KEY",
    secret_iv: "INITIALIZATION_VECTOR",
    encryption_method:  "aes-256-cbc"
  }
};
