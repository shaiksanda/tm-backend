const userModel = require("../models/users")
const taskModel = require("../models/tasks")
const mongoose = require("mongoose");

module.exports.adminDashboard = async (req, res) => {
    try {
        const { role } = req.user;

        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized!" }); // 403 is better for forbidden
        }

        const [users, tasks] = await Promise.all([userModel.find({}).select("username avatar createdAt"), taskModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    completedTasks: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
                }
            },
            { $project: { _id: 0, totalTasks: 1, completedTasks: 1, pendingTasks: 1 } }
        ])])

        const stats = tasks[0] || {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0
        };

        const { totalTasks, completedTasks, pendingTasks } = stats;



        return res.status(200).json({
            users,
            totalUsers: users.length,
            totalTasks,
            completedTasks,
            pendingTasks

        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports.deleteUserProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { userId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    // Prevent admin from deleting themselves
    if (adminId.toString() === userId) {
      return res.status(400).json({
        message: "Admin cannot delete their own account",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const deletedUser = await userModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

