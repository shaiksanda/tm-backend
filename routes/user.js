const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const {registerUser,loginUser,logoutUser,getAllUsers,getStreakData, getProfile}=require("../controllers/user")
const {getDashboard} =require("../controllers/getDashboard")
const {authenticateUser}=require("../middlewares/auth")
const {adminDashboard,deleteUserProfile}=require("../controllers/adminDashboard")
const {userDetails}=require("../controllers/userDetails")
const upload = require("../config/multer");
const {
  uploadProfileImage,
} = require("../controllers/user");


router.post(
  "/upload-profile",
  authenticateUser,
  upload.single("avatar"),
  uploadProfileImage
);

router.post("/register", [
    body('email').isEmail().withMessage("Invalid Email"),
    body("username").isLength({ min: 3 }).withMessage("Username must be atleast 3 characters Long"),
    body("password").isLength({ min: 6 }).withMessage("Password Must be 6 Characters Long.")
],registerUser)

router.post("/login",[
    body("username").isLength({min:3}).withMessage("Username must be atleast 3 characters Long"),
    body("password").isLength({min:6}).withMessage("Password Must be 6 Characters Long.")
],loginUser)

router.get("/admin-dashboard",authenticateUser,adminDashboard)
router.get("/user-detail/:userId",authenticateUser,userDetails)
router.delete("/delete-user-profile/:userId",authenticateUser,deleteUserProfile)

router.get("/all-users",authenticateUser,getAllUsers)
router.get("/logout",authenticateUser,logoutUser)
router.get("/dashboard",authenticateUser,getDashboard)

router.get("/profile",authenticateUser,getProfile)
router.get("/streak",authenticateUser,getStreakData)

module.exports=router