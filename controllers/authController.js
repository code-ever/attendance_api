const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

// ===============================
// REGISTER
// ===============================
exports.register = async (req, res) => {
  try {
    const {
      fullname,
      reg_number,
      phone_number,
      parent_phone,
      student_email,
      password,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
      (fullname, reg_number, phone_number, parent_phone, student_email, password)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fullname,
        reg_number,
        phone_number,
        parent_phone,
        student_email,
        hashedPassword,
      ]
    );

    const userId = result.insertId;

    // QR code contains only the registration number
    const qrCode = await QRCode.toDataURL(reg_number);

    await db.query(
      "UPDATE users SET qr_code = ? WHERE id = ?",
      [qrCode, userId]
    );

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      qr_code: qrCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// LOGIN
// ===============================
exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Login ID and password are required",
      });
    }

    const [users] = await db.query(
      `SELECT *
       FROM users
       WHERE reg_number = ?
       OR student_email = ?`,
      [loginId.trim(), loginId.trim()]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        reg_number: user.reg_number,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET ALL STUDENTS
// ===============================
exports.getAllStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT
        id,
        fullname,
        reg_number,
        phone_number,
        parent_phone,
        student_email,
        qr_code
      FROM users
      ORDER BY fullname ASC`
    );

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};