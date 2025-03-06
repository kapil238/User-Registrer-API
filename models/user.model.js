import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    countryCode: { 
        type: String, 
        required: true 
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    profilePhoto: {
        type: String, 
        default: "" 
    },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
