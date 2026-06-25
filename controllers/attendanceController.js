const db = require( "../config/db" );
const axios = require( "axios" );
require( "dotenv" ).config();
// ===============================
// QR ATTENDANCE SCAN
// ===============================
exports.scanQR = ( req, res ) => {
  try {
    const {
      qr_data,
      subject,
      lecturer_name,
      level,
      department,
    } = req.body;

    if ( !qr_data ) {
      return res.status( 400 ).json( {
        success: false,
        message: "QR data is required",
      } );
    }

    let parsed;

    try {
      parsed = JSON.parse( qr_data );
    } catch ( err ) {
      return res.status( 400 ).json( {
        success: false,
        message: "Invalid QR code format",
      } );
    }

    const userId = parsed.user_id;

    if ( !userId ) {
      return res.status( 400 ).json( {
        success: false,
        message: "User ID not found in QR code",
      } );
    }

    const today = new Date().toISOString().split( "T" )[0];

    // Check if attendance already exists today
    db.query(
      `
      SELECT id
      FROM attendance
      WHERE user_id = ?
      AND DATE(created_at) = ?
      `,
      [userId, today],
      ( err, existing ) => {
        if ( err ) {
          return res.status( 500 ).json( {
            success: false,
            message: err.message,
          } );
        }

        if ( existing.length > 0 ) {
          return res.status( 400 ).json( {
            success: false,
            message: "Attendance already marked today",
          } );
        }

        // Fetch student
        db.query(
          `
          SELECT
            id,
            fullname,
            reg_number,
            parent_phone
          FROM users
          WHERE id = ?
          `,
          [userId],
          async ( err2, users ) => {
            if ( err2 ) {
              return res.status( 500 ).json( {
                success: false,
                message: err2.message,
              } );
            }

            if ( users.length === 0 ) {
              return res.status( 404 ).json( {
                success: false,
                message: "Student not found",
              } );
            }

            const student = users[0];

            // Save attendance
            db.query(
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
              ],
              async ( err3, result ) => {
                if ( err3 ) {
                  return res.status( 500 ).json( {
                    success: false,
                    message: err3.message,
                  } );
                }

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

                // SOCKET.IO REALTIME
                const io = req.app.get( "io" );

                if ( io ) {
                  io.emit(
                    "attendance_marked",
                    attendanceData
                  );
                }

                // SMS
                if ( student.parent_phone ) {
                  try {
                    const AfricasTalking = require( "africastalking" )( {
                      apiKey: process.env.AFRICASTALKING_API_KEY,
                      username: process.env.AFRICASTALKING_USERNAME,
                    } );

                    let phone = student.parent_phone;

                    if ( phone.startsWith( "0" ) ) {
                      phone = "+234" + phone.slice( 1 );
                    } else if ( !phone.startsWith( "+" ) ) {
                      phone = "+" + phone;
                    }

                    const sms = AfricasTalking.SMS;

                    const response = await sms.send( {
                      to: [phone],
                      message: `Dear Parent, ${student.fullname} has been marked PRESENT for ${subject}.`,
                    } );

                    console.log(
                      "FULL RESPONSE:",
                      JSON.stringify( response, null, 2 )
                    );

                    if (
                      response.SMSMessageData &&
                      response.SMSMessageData.Recipients &&
                      response.SMSMessageData.Recipients.length > 0
                    ) {
                      const recipient =
                        response.SMSMessageData.Recipients[0];

                      console.log( "Recipient:", recipient );
                    }
                  } catch ( error ) {
                    console.log( "SMS ERROR:", error );
                  }
                }

                return res.status( 201 ).json( {
                  success: true,
                  message:
                    "Attendance marked successfully",
                  attendance: attendanceData,
                } );
              }
            );
          }
        );
      }
    );
  } catch ( error ) {
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