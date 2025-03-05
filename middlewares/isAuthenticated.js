import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }

        const token = authHeader.split(" ")[1];

        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if (!decode) {
            return res.status(401).json({
                message: "Invalid token",
                success: false,
            });
        }

        req.id = decode.userId;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

export default isAuthenticated;
