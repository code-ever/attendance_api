require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Middleware
app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Create HTTP Server
const server = http.createServer(app);

// Create Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io available inside controllers
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api", studentRoutes);

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Portal API Running",
  });
});

// Socket Connection
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Chat Messages
  socket.on("student_message", (data) => {
    console.log("Message Received:", data);

    io.emit("receive_message", data);
  });

  // Attendance Event (Optional)
  socket.on("attendance_scan", (data) => {
    io.emit("attendance_marked", data);
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT,"0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});