const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const {registerUser,loginUser,logoutUser,getAllUsers,getDashboard,getStreakData,sendOtp,verifyOtp,resetPassword}=require("../controllers/user")
const {authenticateUser}=require("../middlewares/auth")


router.post("/register", [
    body('email').isEmail().withMessage("Invalid Email"),
    body("username").isLength({ min: 3 }).withMessage("Username must be atleast 3 characters Long"),
    body("password").isLength({ min: 6 }).withMessage("Password Must be 6 Characters Long.")
],registerUser)

router.post("/login",[
    body("username").isLength({min:3}).withMessage("Username must be atleast 3 characters Long"),
    body("password").isLength({min:6}).withMessage("Password Must be 6 Characters Long.")
],loginUser)

router.get("/all-users",authenticateUser,getAllUsers)

router.post("/sendOtp",sendOtp)
router.post("/verifyOtp",verifyOtp)
router.post("/resetPassword",resetPassword)


router.get("/logout",authenticateUser,logoutUser)
router.get("/dashboard",authenticateUser,getDashboard)
router.get("/streak",authenticateUser,getStreakData)

module.exports=router