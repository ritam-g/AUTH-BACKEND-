import mongoose from "mongoose";

const otpSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    
},{
    timestamps:true
})

const otpModel=mongoose.model("Otp",otpSchema)

export default otpModel;