const express = require( "express" );
const router = express.Router();

const {
    register,
    login,getAllStudents
} = require( "../controllers/authController" );


const authMiddleware = require( "../middleware/authMiddleware" );

router.post( "/register", register );

router.post( "/login", login );
router.get( "/students", getAllStudents );


router.get( "/profile", authMiddleware, ( req, res ) => {
    res.json( {
        success: true,
        message: "Profile fetched successfully",
        user: req.user
    } );
} );

module.exports = router;