import express from "express";
import { login, logout, register, updateUser, deleteUser } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/mutler.js";
 
const router = express.Router();

router.route("/register").post(singleUpload,register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/user/update/:id").put(isAuthenticated, updateUser);
router.route("/user/delete/:id").delete(isAuthenticated, deleteUser);

export default router;

