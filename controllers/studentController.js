const db = require("../config/db");
// ===============================
// GET ALL STUDENTS
// ===============================
exports.getAllStudents = (req, res) => {
  db.query(
    "SELECT id, fullname, reg_number, phone_number, parent_phone, student_email, qr_code FROM users",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      return res.json({
        success: true,
        count: results.length,
        students: results
      });
    }
  );
};