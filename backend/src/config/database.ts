const path = require("path");
require("../bootstrap");

const config: any = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  dialect: process.env.DB_DIALECT || "mysql",
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  storage: process.env.DB_DIALECT === "sqlite" ? path.resolve(__dirname, "..", "..", "database.sqlite") : undefined,
  logging: false
};

if (process.env.DB_DIALECT === "sqlite") {
  delete config.host;
  delete config.database;
  delete config.username;
  delete config.password;
} else {
  config.timezone = "-03:00";
  delete config.storage;
}

module.exports = config;
