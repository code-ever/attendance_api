const db = require( "../config/db" );
exports.getAllStudents = async ( req, res ) => {
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
      FROM users`
    );

    return res.json( {
      success: true,
      count: students.length,
      students,
    } );
  } catch ( err ) {
    return res.status( 500 ).json( {
      success: false,
      message: err.message,
    } );
  }
};