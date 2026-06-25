const express = require("express");
const router = express.Router();

const {
  scanQR,
  getAllAttendance,
  getAttendanceBySubject,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");

// QR Attendance Scan
router.post("/scan", scanQR);

// Get All Attendance
router.get("/all", authMiddleware, getAllAttendance);

// Get Attendance By Subject
router.get(
  "/subject/:subject",
  authMiddleware,
  getAttendanceBySubject
);

module.exports = router;