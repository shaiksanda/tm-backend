
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true,
    },
    tag: 
      {
        type: String,
        trim: true,
      },
    
    priority: {
      type: String,
    
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      
    },
    selectedDate:{
      type:Date,
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
