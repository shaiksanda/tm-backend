const express = require("express")
const router = express.Router()
const {authenticateUser}=require("../middlewares/auth")

const {postGoal,getGoals,updateGoal,deleteAllGoals,deleteGoal} =require("../controllers/goal")

router.post("/postGoal",authenticateUser,postGoal)
router.get("getGoals",authenticateUser,getGoals)

router.put("/updateGoal/:goalId",authenticateUser,updateGoal)
router.delete("/deleteAllGoals",authenticateUser,deleteAllGoals)

router.delete("/deleteGoal/:goalId",authenticateUser,deleteGoal)

module.exports=router