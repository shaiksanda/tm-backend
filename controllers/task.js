const taskModel = require("../models/tasks")
const sanitize = require("../utils/sanitize")
const mongoose = require("mongoose");
const getTodayDate = require("../utils/getTodayDate");
const { selectFields } = require("express-validator/lib/field-selection");



module.exports.postTask = async (req, res) => {
    try {
        const body = sanitize(req.body)
        const { todo, tag, priority, selectedDate, startTime, endTime } = body;
        const userId = req.user._id


        const newTask = { todo, tag, priority, userId, selectedDate }
        if (startTime) newTask.startTime = startTime;
        if (endTime) newTask.endTime = endTime;
        await taskModel.create(newTask);
        res.status(201).json({ message: "Task added successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
module.exports.getTodayTasks = async (req, res) => {
    try {
        const cleanQuery = sanitize(req.query)
        const userId = req.user._id
        const today = getTodayDate()
        
       
        const filter = {
            userId,
            selectedDate: today
        };
        
        const { tag, priority, search, status } = cleanQuery

        if (search) filter.todo = { $regex: search, $options: "i" }
        if (tag) filter.tag = tag
        if (priority) filter.priority = priority
        if (status) filter.status = status

        const tasks = await taskModel.find(filter, { todo: 1, status: 1, selectedDate: 1, tag: 1, startTime: 1, endTime: 1 }).sort({ startTime: 1, endTime: 1 });
        return res.status(200).json(tasks);
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

module.exports.getTasks = async (req, res) => {
    const cleanQuery = sanitize(req.query)
    const { tag, status, priority, selectedDate, search } = cleanQuery;
    const userId = req.user._id;
    const filter = { userId };
    if (search) filter.todo = { $regex: search, $options: "i" }
    if (tag) filter.tag = tag;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (selectedDate) {
        filter.selectedDate = selectedDate
    }

    try {
        const tasks = await taskModel.find(filter, { todo: 1, status: 1 }).sort({ selectedDate: -1 });;

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

module.exports.getTask = async (req, res) => {
    try {
        const { taskId } = req.params
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: "Invalid Task Id" });
        }
        const userId = req.user._id
        const task = await taskModel.findOne({ _id: taskId, userId })
        if (!task) {
            return res.status(404).json({ message: "Task Not Found" });
        }
        return res.status(200).json(task)
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


module.exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: "Invalid Task Id" });
        }

        const userId = req.user._id;
        const cleanBody = sanitize(req.body)
        const { todo, status, tag, priority, startTime, endTime } = cleanBody;


        const updates = {};
        if (todo !== undefined) updates.todo = todo;
        if (status !== undefined) updates.status = status;
        if (tag !== undefined) updates.tag = tag;
        if (priority !== undefined) updates.priority = priority;
        if (startTime !== undefined) updates.startTime = startTime;
        if (endTime !== undefined) updates.endTime = endTime

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const existingTask = await taskModel.findOne({ _id: taskId, userId });
        if (!existingTask) {
            return res.status(404).json({ message: "Task Not Found" });
        }

        const today = getTodayDate();

        if (existingTask.selectedDate !== today) {
            return res.status(403).json({
                message: "You can update task only on the created date"
            });
        }
        
        const updatedTask = await taskModel.findOneAndUpdate(
            { _id: taskId, userId },
            { $set: updates },
            { new: true }
        );

        return res.status(200).json(updatedTask);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: "Invalid Task Id" });
    }

    const userId = req.user._id;
    try {

        const deletedTask = await taskModel.findOneAndDelete({ _id: taskId, userId });
        if (!deletedTask) {
            return res.status(404).send({ message: "Task Not Found!" });
        }
        res.status(200).json({ message: "Task deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}