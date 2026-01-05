const userModel = require("../models/users")
const taskModel = require("../models/tasks")
const mongoose = require("mongoose")



module.exports.adminDashboard = async (req, res) => {
    try {
        const { role } = req.user;

        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized!" }); // 403 is better for forbidden
        }

        
        const users = await userModel.find({}).select("username avatar createdAt");
        
        return res.status(200).json({
            users
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
