const db = require( "../config/db" );
const axios = require( "axios" );
require( "dotenv" ).config();
const { sendSMS } = require( "../services/termiiService" );
// const twilio = require( "twilio" );
// ===============================
// QR ATTENDANCE SCAN
// ===============================
exports.scanQR = async ( req, res ) => {
  try {
    const {
      reg_number,
      subject,
      lecturer_name,
      level,
      department,
    } = req.body;

    if ( !reg_number ) {
      return res.status( 400 ).json( {
        success: false,
        message: "Registration number is required!",
      } );
    }

    // Get student by registration number
    const [users] = await db.query(
      `
      SELECT id, fullname, reg_number, parent_phone
      FROM users
      WHERE reg_number = ?
      `,
      [reg_number]
    );

    if ( users.length === 0 ) {
      return res.status( 404 ).json( {
        success: false,
        message: "Student not found",
      } );
    }

    const student = users[0];
    const userId = student.id;

    const today = new Date().toISOString().split( "T" )[0];

    // Check if attendance already exists today
    const [existing] = await db.query(
      `
      SELECT id
      FROM attendance
      WHERE user_id = ?
      AND DATE(created_at) = ?
      `,
      [userId, today]
    );

    if ( existing.length > 0 ) {
      return res.status( 400 ).json( {
        success: false,
        message: "Attendance already marked today",
      } );
    }

    // Save attendance
    const [result] = await db.query(
      `
      INSERT INTO attendance
      (
        user_id,
        subject,
        lecturer_name,
        status,
        level,
        department
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        subject,
        lecturer_name,
        "present",
        level,
        department,
      ]
    );

    const attendanceData = {
      attendance_id: result.insertId,
      user_id: student.id,
      fullname: student.fullname,
      reg_number: student.reg_number,
      parent_phone: student.parent_phone,
      subject,
      lecturer_name,
      level,
      department,
      status: "present",
      created_at: new Date(),
    };

    // Socket.IO
    const io = req.app.get( "io" );

    if ( io ) {
      io.emit( "attendance_marked", attendanceData );
    }

    // Send SMS
    // Send SMS
    console.log( "Parent Phone:", student.parent_phone );

    if ( student.parent_phone ) {
      console.log( "Sending SMS..." );
      try {
        const smsResponse = await sendSMS(
          student.parent_phone,
          `Dear Parent, ${student.fullname} has been marked PRESENT for ${subject}.`
        );

        console.log( "SMS Sent:", smsResponse );
      } catch ( error ) {
        console.error( "SMS Error:", error.response?.data || error.message );
      }
    }
    // IMPORTANT: Return a response to the frontend
    return res.status( 201 ).json( {
      success: true,
      message: "Attendance marked successfully.",
      attendance: attendanceData,
    } );

  } catch ( error ) {
    console.error( error );

    return res.status( 500 ).json( {
      success: false,
      message: error.message,
    } );
  }
};

// ===============================
// GET ALL ATTENDANCE
// ===============================
exports.getAllAttendance = ( req, res ) => {
  db.query(
    `
    SELECT
      a.id,
      a.user_id,
      u.fullname,
      u.reg_number,
      u.parent_phone,
      a.subject,
      a.lecturer_name,
      a.status,
      a.level,
      a.department,
      a.created_at
    FROM attendance a
    JOIN users u
      ON a.user_id = u.id
    ORDER BY a.created_at DESC
    `,
    ( err, results ) => {
      if ( err ) {
        return res.status( 500 ).json( {
          success: false,
          message: err.message,
        } );
      }

      return res.json( {
        success: true,
        count: results.length,
        attendance: results,
      } );
    }
  );
};

// ===============================
// GET ATTENDANCE BY SUBJECT
// ===============================
exports.getAttendanceBySubject = ( req, res ) => {
  const { subject } = req.params;

  db.query(
    `
    SELECT
      a.id,
      a.user_id,
      u.fullname,
      u.reg_number,
      u.parent_phone,
      a.subject,
      a.lecturer_name,
      a.status,
      a.level,
      a.department,
      a.created_at
    FROM attendance a
    JOIN users u
      ON a.user_id = u.id
    WHERE a.subject = ?
    ORDER BY a.created_at DESC
    `,
    [subject],
    ( err, results ) => {
      if ( err ) {
        return res.status( 500 ).json( {
          success: false,
          message: err.message,
        } );
      }

      return res.json( {
        success: true,
        subject,
        count: results.length,
        attendance: results,
      } );
    }
  );
};