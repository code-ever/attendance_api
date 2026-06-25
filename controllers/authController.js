const bcrypt = require( "bcryptjs" );
const db = require( "../config/db" );
const jwt = require( "jsonwebtoken" );
const QRCode = require( "qrcode" );

exports.register = async ( req, res ) => {
  try {
    const {
      fullname,
      reg_number,
      phone_number,
      parent_phone,
      student_email,
      password
    } = req.body;

    const hashedPassword = await bcrypt.hash( password, 10 );

    db.query(
      `INSERT INTO users 
      (fullname, reg_number, phone_number, parent_phone, student_email, password)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fullname,
        reg_number,
        phone_number,
        parent_phone,
        student_email,
        hashedPassword
      ],
      async ( err, result ) => {
        if ( err ) {
          return res.status( 400 ).json( {
            success: false,
            message: err.message
          } );
        }

        const userId = result.insertId;

        // 🔥 QR CONTENT (IMPORTANT)
        const qrPayload = {
          user_id: userId,
          fullname,
          reg_number
        };

        const qrCode = await QRCode.toDataURL( JSON.stringify( qrPayload ) );

        db.query(
          "UPDATE users SET qr_code=? WHERE id=?",
          [qrCode, userId]
        );

        return res.status( 201 ).json( {
          success: true,
          message: "Student registered successfully",
          qr_code: qrCode
        } );
      }
    );
  } catch ( error ) {
    return res.status( 500 ).json( {
      success: false,
      message: error.message
    } );
  }
};

exports.login = ( req, res ) => {
  const { loginId, password } = req.body;

  if ( !loginId || !password ) {
    return res.status( 400 ).json( {
      message: "Login ID and password are required"
    } );
  }

  db.query(
    `SELECT * FROM users 
     WHERE reg_number = ? 
     OR student_email = ?`,
    [loginId.trim(), loginId.trim()],
    async ( err, result ) => {
      if ( err ) {
        return res.status( 500 ).json( {
          message: "Server error",
          error: err.message
        } );
      }

      if ( result.length === 0 ) {
        return res.status( 400 ).json( {
          message: "Invalid credentials"
        } );
      }

      const user = result[0];

      const match = await bcrypt.compare( password, user.password );

      if ( !match ) {
        return res.status( 400 ).json( {
          message: "Invalid credentials"
        } );
      }

      const token = jwt.sign(
        {
          id: user.id,
          reg_number: user.reg_number
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json( {
        success: true,
        token,
        user
      } );
    }
  );
};

