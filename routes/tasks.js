const express = require("express")
const router = express.Router()
const {authenticateUser}=require("../middlewares/auth")

const {postTask,getTasks,updateTask,deleteAllTasks,deleteTask}=require("../controllers/task")

router.post("/postTask",authenticateUser,postTask)
router.get("/getTasks",authenticateUser,getTasks)

router.put("/updateTask/:taskId",authenticateUser,updateTask)

router.delete("/deleteAllTasks",authenticateUser,deleteAllTasks)
router.delete("/deleteTask/:taskId",authenticateUser,deleteTask)

module.exports=router