const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    todo: {
      type: String,
      required: true,
      trim: true,
    },

    tag: {
      type: String,
      trim: true,
      default: null,
      required:true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required:true
    },

    
    selectedDate: {
      type: String,
      required: true,
    },

   
    startTime: {
      type: String, // "HH:mm"
      default: null,
    },

    endTime: {
      type: String, // "HH:mm"
      default: null,
    },


    status: {
      type: String,
      enum: ["pending", "completed", "missed"],
      default: "pending",
    },

    failureReason: {
      type: String,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

  
    noTaskReason: {
      type: String,
      default: null,
    },

    noTaskReasonDate: {
      type: Date,
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
