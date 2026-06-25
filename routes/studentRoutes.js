const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllStudents
} = require("../controllers/studentController");

router.get("/all", authMiddleware, getAllStudents);

module.exports = router;