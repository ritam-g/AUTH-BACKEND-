import mongoose from "mongoose";


const sessionSchema = new mongoose.Schema({
    // Reference to the User who owns this session
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    // SHA-256 Hash of the refresh token. We store the hash for security.
    refreshTokenHash: {
        type: String,
        required: true
    },
    // If true, this session is no longer valid (logout or forced revocation)
    revoked: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    // IP address where the session was created
    ip: {
        type: String,
        required: true
    },
    // Browser/Device string where the session was created
    userAgent: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

const sessionModel=mongoose.model("sessions",sessionSchema)

export default sessionModel;