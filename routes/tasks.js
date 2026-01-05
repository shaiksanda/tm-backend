const express = require("express")
const router = express.Router()
const {authenticateUser}=require("../middlewares/auth")

const {postTask,getTasks,updateTask,updateAllTasks,deleteTask,getTodayTasks,getTask}=require("../controllers/task")

router.post("/postTask",authenticateUser,postTask)
router.get("/getTasks",authenticateUser,getTasks)
router.get("/today-tasks",authenticateUser,getTodayTasks)
router.get("/task/:taskId",authenticateUser,getTask)



router.put("/updateTask/:taskId",authenticateUser,updateTask)

router.delete("/deleteTask/:taskId",authenticateUser,deleteTask)

module.exports=router