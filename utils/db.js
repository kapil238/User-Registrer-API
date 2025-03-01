import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('mongodb connected successfully');

    } catch (error) {
        console.log(error);

    }
}

// function connectDB() {
//   mongoose
//     .connect(process.env.MONGO_URL)
//     .then(() => console.log("mongodb connected successfully"))
//     .catch((err) => console.log("Error connected DB", err));
// }

export default connectDB;
