const mongoose=require("mongoose")

const feedbackSchema=new mongoose.Schema({
    type:{
        type:String,
        required:true,
        enum:["bug","suggestion","feedback"]
    },
    message:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:["pending","resolved"],
        default:"pending"
    }
},
{timestamps:true})
const feedbackModel=mongoose.model("Feedback",feedbackSchema)

module.exports=feedbackModel