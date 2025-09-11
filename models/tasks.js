
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    todo: {
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
const taskModel=mongoose.model("Todo", taskSchema);
module.exports =taskModel