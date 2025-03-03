import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, countryCode, phoneNumber, password,confirmPassword, role } = req.body;
         
        if (!fullname || !email || !countryCode || !phoneNumber || !password || !confirmPassword || !role) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match!",
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email.',
                success: false,
            });
        }

        let profilePhoto = "";
        if (req.file) {
            console.log("File Uploaded:", req.file);
            const fileUri = getDataUri(req.file);
            console.log("File URI:", fileUri);

            const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                folder: "user_profiles", // Organize uploads
                transformation: [{ width: 300, height: 300, crop: "fill" }] // Resize
            });

            console.log("Cloudinary Response:", cloudResponse);
            profilePhoto = cloudResponse.secure_url;
        }

        console.log("Final Profile Photo URL:", profilePhoto);


        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullname,
            email,
            countryCode,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: { profilePhoto }
        });
        console.log(user);  
        return res.status(201).json({
            message: "Account created successfully.",
            user,
            success: true
        });
        
        
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            });
        }

        const tokenData = { userId: user._id };
        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        return res.status(200).cookie("token", token, { 
            maxAge: 24 * 60 * 60 * 1000, 
            httpOnly: true, 
            sameSite: 'strict' 
        }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        const userId = req.id; // From authentication middleware

        let user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            });
        }

        let skillsArray = skills ? skills.split(",") : [];

        let resumeUrl = user.profile.resume;
        let resumeOriginalName = user.profile.resumeOriginalName;

        if (req.file) {
            const fileUri = getDataUri(req.file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            resumeUrl = cloudResponse.secure_url;
            resumeOriginalName = req.file.originalname;
        }

        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.profile.bio = bio || user.profile.bio;
        user.profile.skills = skillsArray.length > 0 ? skillsArray : user.profile.skills;
        user.profile.resume = resumeUrl;
        user.profile.resumeOriginalName = resumeOriginalName;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            user,
            success: true
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
