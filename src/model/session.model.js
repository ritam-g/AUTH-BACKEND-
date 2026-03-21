import mongoose from "mongoose";


const sessionSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    refreshTokenHash:{
        type:String,
        required:true
    },
    revoked: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    ip:{
        type:String,
        required:true
        
    },
    userAgent:{
        type:String,
        required:true
        
    }

},{
    timestamps:true
})

const sessionModel=mongoose.model("sessions",sessionSchema)

export default sessionModel;