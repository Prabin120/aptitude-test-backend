import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import ICustomRequest from "../utils/customRequest";
import { requestingForCreatorAccess, sendMailResetPasswordMail, sentEmailVerificationMail } from "../utils/mailService";
import { verifyToken } from "../middlewares/authMiddleware";
import { v4 as uuidv4 } from 'uuid';
import roles, { isCreator } from "../roles/roles";
import { getCoins, getCoinsData } from "./rewardsController";

const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY as string;
const JWT_ACCESS_EXPIRY_TIME =
    process.env.JWT_ACCESS_EXPIRY_TIME ?? ("24h" as string);
const JWT_REFRESH_EXPIRY_TIME =
    process.env.JWT_REFRESH_EXPIRY_TIME ?? ("7d" as string);
const JWT_PASSWORD_RESET_TIME = process.env.JWT_PASSWORD_RESET_TIME as string;
const CLIENT_DOMAIN_URL = process.env.CLIENT_DOMAIN_URL as string;

interface ISignUpBody {
    username: string;
    email: string;
    password: string;
    name: string;
    mobile?: string;
    institute?: string;
    bio?: string;
    location?: string;
    company?: string;
    github?: string;
    twitter?: string;
    website?: string;
    memberSince?: string;
}
interface ILoginBody {
    email: string;
    password: string;
}

interface DecodedToken {
    username: string;
}

const getToken = (username: string, name: string, role: string, refresh = false) => {
    return jwt.sign({ username, name, role }, JWT_ACCESS_SECRET_KEY, {
        expiresIn: refresh ? JWT_REFRESH_EXPIRY_TIME : JWT_ACCESS_EXPIRY_TIME,
    });
};

const generateToken = (
    res: Response,
    user: IUser,
    status: number,
    message: string,
    coins: number,
) => {
    const access_token = getToken(user.username, user.name, user.role);
    const refresh_token = getToken(user.username, user.name, user.role, true);
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
                name: user.name,
                email: user.email,
                username: user.username,
                coins: coins,
            },
        });
};

const signUp = async (req: ICustomRequest, res: Response) => {
    try {
        const { username, email, password, name, mobile, institute, bio, location, company, github, twitter, website }: ISignUpBody = req.body;
        if (!username || !email || !password || !name) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            let message = "";
            message =
                email === existingUser.email
                    ? "Email already in use"
                    : "Username already in use";
            return res.status(400).json({ message });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            mobile : mobile ?? "",
            institute : institute ?? "",
            username,
            bio : bio ?? "",
            location : location ?? "",
            company : company ?? "",
            github : github ?? "",
            twitter : twitter ?? "",
            website : website ?? "",
            memberSince: new Date().toISOString(),
        });
        await newUser.save();
        const coins = await getCoins(username);
        return generateToken(res, newUser, 201, "User created successfully", coins?.balance ?? 0);
    } catch (error) {
        console.log("signup error", error);
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
        const coins = await getCoins(user.username);
        return generateToken(res, user, 200, "Login successful", coins?.balance ?? 0);
    } catch (error) {
        console.log("login error", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const changePassword = async (req: ICustomRequest, res: Response) => {
    const username = req.username;
    const { confirmPassword, newPassword, currentPassword } = req.body;
    try {
        if(confirmPassword !== newPassword){
            return res.status(400).json({message: "New password and confirm password do not match"});
        }
        const user = await User.findOne({username});
        if (!user) {
            return res.status(403).json({ message: "Not authorised" });
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        const coins = await getCoins(user.username);
        return generateToken(res, user, 200, "Password changed successful", coins?.balance ?? 0);
    } catch (error) {
        console.log("changePassword error", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const logout = async (req: ICustomRequest, res: Response) => {
    res.clearCookie("access_token", { httpOnly: true });
    res.clearCookie("refresh_token", { httpOnly: true });
    return res.status(200).json({ message: "Logout successful" });
};

const forgotPassword = async (req: ICustomRequest, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email address not found" });
        }
        const token = jwt.sign(
            { username: user.username, role: user.role },
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
        console.log("forgotPassword error", error);
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
    const username = decodedToken.username;
    if (!username) {
        res.status(401).json({ message: "Authentication failed" });
        return;
    }
    const user = await User.findOne({username});
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    const token = jwt.sign(
        { username: user.username, role: user.role },
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
                username: user.username,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                institute: user.institute,
            },
        });
};

const validToken = async (req: Request, res: Response) => {
    return res.status(200).json({message: "Token is valid"});
};

const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refresh_token;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const decodedToken = verifyToken(token);
        if (!decodedToken) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const { username, role, name } = decodedToken;
        const access_token = getToken(username, name, role);
        const refresh_token = getToken(username, name, role, true);
        
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
            .json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.log("refreshToken error", error);
        return res.status(401).json({ message: (error as Error).message });
    }
};

const googleLogin = async (googleUser: {name: string, email: string, picture: string, mobile: string}) => {
    try {
        const user = await User.findOne({ email: googleUser.email });
        if (user) return {access_token: getToken(user.username, user.name, user.role), refresh_token: getToken(user.username, user.name, user.role, true)};
        const hashedPassword = await bcrypt.hash(uuidv4.toString(), 10);
        const username = googleUser.email.split("@")[0]+Math.random().toString(36).substring(2, 15);
        const newUser = new User({
            username,
            email: googleUser.email,
            password: hashedPassword,
            name: googleUser.name,
            mobile: googleUser.mobile??"",
            institute: "Not given",
            image: googleUser.picture,
            memberSince: new Date().toISOString(),
            role: "user",
            emailVerified: true,
        });
        await newUser.save();
        return {access_token: getToken(newUser.username, newUser.name, newUser.role), refresh_token: getToken(newUser.username, newUser.name, newUser.role, true)};
    } catch (error) {
        console.log("googleLogin error", error);
        return {access: "", refresh: ""};
    }
};

const googleCallback = async (req: Request, res: Response) => { };

const accessForCreator = async (req: ICustomRequest, res: Response) => {
    const username = req.username;
    if (!username) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    if(isCreator(user.role)){
        return res.status(200).json({ message: "You aleady have the access" });
    }
    if(!user.email || !user.mobile || !user.emailVerified || !user.institute){
        return res.status(400).json({ message: "Please complete your profile, email, mobile, institute and vefiy your email" });
    }
    user.role = "creator";
    await user.save();
    await requestingForCreatorAccess(user.email, user.username);
    const access_token = getToken(username, user.name, user.role);
    const refresh_token = getToken(username, user.name, user.role, true);
    
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
        .status(200)
        .json({ message: "Access granted" });
}

const emailVerificationLink = async (req: ICustomRequest, res: Response) => {
    const username = req.username;
    if (!username) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    const token = jwt.sign({ username, type: "emailVerification", email:user.email }, JWT_ACCESS_SECRET_KEY, {
        expiresIn: "2d",
    });
    const link = `${CLIENT_DOMAIN_URL}/verification/?type=Email&token=${token}`;
    await sentEmailVerificationMail(user.name, user.email, link);
    return res.status(200).json({ message: "Verification link sent to your email" });
}

const verifyEmailLink = async (req: ICustomRequest, res: Response) => {
    const username = req.username;
    if (!username) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Invalid request" });
    }
    const decodedToken = jwt.verify(token as string, JWT_ACCESS_SECRET_KEY) as {
        username: string;
        type: string;
        email: string;
    };
    if (decodedToken.type !== "emailVerification" || decodedToken.username !== username) {
        return res.status(400).json({ message: "Invalid request" });
    }
    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
        return res.status(400).json({ message: "Invalid request" });
    }
    if (user.emailVerified) {
        return res.status(200).json({ message: "Email already verified" });
    }
    user.emailVerified = true;
    await user.save();
    return res.status(200).json({ message: "Email verified successfully" });
}

export {
    signUp,
    login,
    validToken,
    changePassword,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken,
    googleLogin,
    googleCallback,
    accessForCreator,
    emailVerificationLink,
    verifyEmailLink,
};
