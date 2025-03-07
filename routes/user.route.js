import express from "express";
import { login, logout, register, updateUser, deleteUser, getUsersByRole, getUserById, getMyProfile, forgotPassword, resetPassword} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './images/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
  const upload = multer({ storage: storage })
 
const router = express.Router();

router.route("/register").post(upload.single('profilePhoto'), register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/update/:id").put(isAuthenticated, updateUser);
router.route("/delete/:id").delete(isAuthenticated, deleteUser);
router.route("/users").get(isAuthenticated, getUsersByRole);
router.route("/user/:id").get(isAuthenticated, getUserById); 
// Forgot Password Route
router.route("/forgot-password").post(forgotPassword);

// Reset Password Route
router.route("/reset-password/:token").post(resetPassword);
router.route("/myprofile").get(isAuthenticated, getMyProfile); 

export default router;

