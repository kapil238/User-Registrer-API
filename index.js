import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";

dotenv.config({});

const app = express();

// app.get("/home" , (req,res)=> {
//     return res.status(200).json({
//         message:"I am coming from backend",
//         success:true
//     })
// });
// connectDB();

app.use(express.json());

app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
const corsoptions = {
    origin: "http://localhost:5173", // ✅ Corrected URL
    credentials: true,
};

app.use(cors(corsoptions))

app.use("/api/v1/user", userRoute); 




const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at port ${PORT}`);
    });
});
