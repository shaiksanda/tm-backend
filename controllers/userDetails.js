const userModel = require("../models/users")
const taskModel = require("../models/tasks")



module.exports.userDetails = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized!" });
        }

        const {userId} = req.params;
        
        const user = await userModel.findById(userId).select('-password'); 

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const totalTasks = await taskModel.countDocuments({ userId });
        const completedTasks = await taskModel.countDocuments({ userId, status: 'completed' });

        return res.status(200).json({
            user,
            tasksSummary: {
                totalTasks,
                completedTasks
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
