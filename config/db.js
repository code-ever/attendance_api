require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection(process.env.MYSQL_URL);
require("dotenv").config();

console.log("=== ENV CHECK ===");
console.log("MYSQLHOST:", process.env.MYSQLHOST);
console.log("MYSQLPORT:", process.env.MYSQLPORT);
console.log("MYSQLUSER:", process.env.MYSQLUSER);
console.log("MYSQLDATABASE:", process.env.MYSQLDATABASE);
console.log("MYSQL_URL:", process.env.MYSQL_URL);
console.log("DATABASE_URL:", process.env.DATABASE_URL);

process.exit(0);
db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("MySQL Connected Successfully");
  }
});

module.exports = db;