require("dotenv").config();
console.log("ALL ENV KEYS:", Object.keys(process.env));
console.log("🔥 MYSQL ENV CHECK:");
console.log("HOST:", process.env.MYSQLHOST);
console.log("PORT:", process.env.MYSQLPORT);
console.log("USER:", process.env.MYSQLUSER);
console.log("PASS:", process.env.MYSQLPASSWORD);
console.log("DB:", process.env.MYSQLDATABASE);

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB ERROR:", err);
  } else {
    console.log("✅ MySQL Connected Successfully");
  }
});

module.exports = db;