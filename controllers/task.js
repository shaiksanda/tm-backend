const taskModel = require("../models/tasks")

module.exports.postTask = async (req, res) => {
    try {
        const { todo, tag, priority, selectedDate } = req.body;
        const  userId  = req.user._id

        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0)
        await taskModel.create({ todo, tag, priority, userId, selectedDate: date });
        res.status(201).json({ message: "Task added successfully" });
    }
    catch (error) {

        res.status(500).json({ message: error.message });
    }
}

module.exports.getTasks = async (req, res) => {
    const { tag, status, priority, selectedDate } = req.query;
    const userId = req.user._id;
    const filter = { userId };

    if (tag) filter.tag = tag;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (selectedDate) {

        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1); // Set nextDate to the start of the next day
        filter.selectedDate = { $gte: date, $lt: nextDate };
    }

    try {
        const tasks = await taskModel.find(filter);
        
        res.status(200).json(tasks);           // Send filtered todos
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

module.exports.updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { todo, tag, priority, status, selectedDate } = req.body;
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    try {
        const updatedTask = await taskModel.findByIdAndUpdate(
            taskId,
            { todo, tag, priority, status, selectedDate: date },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).send({ message: 'Task not found' });
        }
        res.status(200).json({ message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.deleteAllTasks = async (req, res) => {
    try {
        const  userId  = req.user._id;
        await taskModel.deleteMany({ userId });
        res.status(200).json({ message: "All tasks deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;  // Extract todoId from the URL parameter
    const  userId  = req.user._id;
    try {
        // Delete the todo by its ID
        const deletedTask = await taskModel.findOneAndDelete({ _id: taskId, userId });
        if (!deletedTask) {
            return res.status(404).send({ message: "Task not found or unauthorized" });
        }
        res.status(200).json({ message: "Task deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}