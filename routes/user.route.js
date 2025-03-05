import express from "express";
import { login, logout, register, updateUser, deleteUser, getUsersByRole, getUserById, getMyProfile} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/mutler.js";
 
const router = express.Router();

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/update/:id").put(isAuthenticated, updateUser);
router.route("/delete/:id").delete(isAuthenticated, deleteUser);
router.route("/users").get(isAuthenticated, getUsersByRole);
router.route("/user/:id").get(isAuthenticated, getUserById); 

router.route("/myprofile").get(isAuthenticated, getMyProfile); 

export default router;

