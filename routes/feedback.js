const express=require("express")
const router=express.Router()
const {authenticateUser}=require("../middlewares/auth")
const {postFeedback,getFeedbacks,updateFeedback,deleteFeedback}=require("../controllers/feedback")

router.post("/postFeedback",authenticateUser,postFeedback)
router.get("/getFeedbacks",authenticateUser,getFeedbacks)

router.put("/updateFeedback/:feedbackId",authenticateUser,updateFeedback)

router.delete("/deleteFeedback/:feedbackId",authenticateUser,deleteFeedback)


module.exports=router