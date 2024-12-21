import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import ICustomRequest from "../utils/customRequest";
import { sendMailResetPasswordMail } from "../utils/mailService";
import { verifyToken } from "../middlewares/authMiddleware";
import { get } from "http";

const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY as string;
const JWT_ACCESS_EXPIRY_TIME = process.env.JWT_ACCESS_EXPIRY_TIME?? "24h" as string;
const JWT_REFRESH_EXPIRY_TIME = process.env.JWT_REFRESH_EXPIRY_TIME?? "7d" as string;
const JWT_PASSWORD_RESET_TIME = process.env.JWT_PASSWORD_RESET_TIME as string;
const CLIENT_DOMAIN_URL = process.env.CLIENT_DOMAIN_URL as string;

interface ISignUpBody {
    email: string;
    password: string;
    name: string;
    mobile?: string;
    institute?: string;
}
interface ILoginBody {
    email: string;
    password: string;
}

interface DecodedToken {
    userId: string;
}

const getToken = (userId: string, role: string, refresh = false) => {
    return jwt.sign(
        { userId, role},
        JWT_ACCESS_SECRET_KEY,
        {
            expiresIn: refresh ? JWT_REFRESH_EXPIRY_TIME : JWT_ACCESS_EXPIRY_TIME,
        }
    )
} 

const generateToken = (res: Response, user: IUser, status: number, message: string) => {
    const access_token = getToken(user._id, user.role);
    const refresh_token = getToken(user._id, user.role, true);
    return res
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        .cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        .status(status)
        .json({
            message: message,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                institute: user.institute,
            },
        });
};

const signUp = async (req: ICustomRequest, res: Response) => {
    try {
        const { email, password, name, mobile, institute }: ISignUpBody = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            let message = "";
            message =
                email === existingUser.email
                    ? "Email already in use"
                    : "Mobile number already in use";
            return res.status(400).json({ message });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            mobile,
            institute,
        });
        await newUser.save();
        return generateToken(res, newUser, 201, "User created successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const login = async (req: ICustomRequest, res: Response) => {
    try {
        const { email, password }: ILoginBody = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        return generateToken(res, user, 200, "Login successful");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const changePassword = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({ message: "Not authorised" });
        }
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return generateToken(res, user, 200, "Password changed successful");
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const logout = async (req: ICustomRequest, res: Response) => {
    res.clearCookie("access_token", { httpOnly: true });
    res.clearCookie('refresh_token', { httpOnly: true});
    return res.status(200).json({ message: "Logout successful" });
};

const forgotPassword = async (req: ICustomRequest, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(403).json({ message: "Email address not found" });
        }
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_ACCESS_SECRET_KEY,
            {
                expiresIn: JWT_PASSWORD_RESET_TIME,
            }
        );
        const resetLink = `${CLIENT_DOMAIN_URL}/reset-password/?token=${token}`;
        await user.save();
        const response = await sendMailResetPasswordMail(
            user.name,
            user.email,
            resetLink
        );
        if (response) {
            return res
                .status(200)
                .json({ message: "Password reset link sent to your email" });
        }
        return res
            .status(500)
            .json({ message: "There is some issue please send a mail to support" });
    } catch (error) {
        return res.status(500).json({ message: "Forgot password Server error" });
    }
};

const resetPassword = async (req: ICustomRequest, res: Response) => {
    const { token: tokenId } = req.query;
    const { password } = req.body;
    if (!tokenId || !password) {
        return res.status(400).json({ message: "Invalid request" });
    }
    const decodedToken = jwt.verify(
        tokenId as string,
        JWT_ACCESS_SECRET_KEY
    ) as DecodedToken;
    const userId = decodedToken.userId;
    if (!userId) {
        res.status(401).json({ message: "Authentication failed" });
        return;
    }
    const user = await User.findById(userId);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_ACCESS_SECRET_KEY,
        {
            expiresIn: JWT_ACCESS_EXPIRY_TIME,
        }
    );
    return res
        .cookie("access_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        .status(201)
        .json({
            message: "Password reset successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                institute: user.institute,
            },
        });
};

const validToken = async (req: Request, res: Response) => {
    return res.status(200);
};

const refreshToken = async(req: Request, res: Response) => {
    try {
        const token = req.cookies.refresh_token;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const decodedToken = verifyToken(token);
        const userId = decodedToken?.userId;
        const role = decodedToken?.role;
        if (!userId || !role) {
            return res.status(401).json({ message: "Authentication failed" });
        }
        const access_token = getToken(userId, role);
        const refresh_token = getToken(userId, role, true);
        res
            .cookie("access_token", access_token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .cookie("refresh_token", refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .status(200)
            .json({message: "Token refreshed successfully"});
        return res
    } catch (error) {
        return res.status(401).json({ message: (error as Error).message });
    }
};

export {
    signUp,
    login,
    validToken,
    changePassword,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken,
};
