import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import nodemailer from "nodemailer";

export const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      countryCode,
      phoneNumber,
      password,
      confirmPassword,
      role,
    } = req.body;

    if (
      !fullname ||
      !email ||
      !countryCode ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !role
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Passwords do not match!", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({
          message: "User already exists with this email.",
          success: false,
        });
    }

    let profilePhoto = "";
    if (req.file) {
      try {
        const cloudResponse = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_photos", // Optional: Store in a specific Cloudinary folder
        });
        // console.log("cloudResponse ==> ",cloudResponse.secure_url);

        profilePhoto = cloudResponse.secure_url;
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res
          .status(500)
          .json({ error: "Failed to upload profile photo" });
      }
    }

    console.log("check ==> ", profilePhoto);

    console.log("Final Profile Photo URL:", profilePhoto);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      countryCode,
      phoneNumber,
      password: hashedPassword,
      role,
      profilePhoto: profilePhoto,
    });

    console.log(user);

    return res.status(201).json({
      message: "Account created successfully.",
      user,
      success: true,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
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
        success: false,
      });
    }

    const tokenData = { userId: user._id };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        token, // ✅ Include the token in response
        success: true,
      });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required", success: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    // Save token & expiry to DB
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    // Email content
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
    });

    res.json({ message: "Password reset email sent", success: true });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match!", success: false });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findOne({ _id: decoded.id, resetToken: token });

        if (!user || user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired token", success: false });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        // Clear reset token
        user.resetToken = "";
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ message: "Password reset successfully", success: true });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const updateUser = async (req, res) => {
  try {
    const { fullname, email, countryCode, phoneNumber, role } = req.body;
    const userId = req.params.id;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.countryCode = countryCode || user.countryCode;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.role = role || user.role;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully.",
      user,
      success: true,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id; // Get user ID from params

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "User deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });

    if (!users.length) {
      return res.status(404).json({
        message: "No users found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Users fetched successfully.",
      users,
      success: true,
    });
  } catch (error) {
    console.error("Get Users By Role Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "User fetched successfully.",
      user,
      success: true,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
