import jwt from "jsonwebtoken";
import User from "../models/user";
import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import ICustomRequest from "../utils/customRequest";

const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY as string;
const JWT_ACCESS_EXPIRY_TIME = process.env.JWT_ACCESS_EXPIRY_TIME as string;

interface ISignUpBody{
    email: string;
    password: string;
    name: string;
    mobile?: string;
    institute?: string;
}
interface ILoginBody{
    email: string;
    password: string;
}

const signUp = async (req: ICustomRequest, res: Response) => {
    try {
        const { email, password, name, mobile, institute }: ISignUpBody = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({$or:[{email}, {mobile}]});
        if (existingUser) {
            let message = "";
            message = email === existingUser.email ? "Email already in use": 
                "Mobile number already in use";
            return res.status(400).json({message});
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            mobile,
            institute,
        });

        // Save the user to the database
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id }, JWT_ACCESS_SECRET_KEY, {
            expiresIn: JWT_ACCESS_EXPIRY_TIME,
        });
        // Send response with token
        return res
        .cookie('access_token', token, {
            httpOnly: true
        })
        .status(201).json({
            message: "User registered successfully",
            data: newUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const login = async (req: ICustomRequest, res: Response) => {
    try {
        const { email, password }: ILoginBody = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_ACCESS_SECRET_KEY, {
            expiresIn: JWT_ACCESS_EXPIRY_TIME,
        });

        // Send response with token
        return res
        .cookie('access_token', token, {
            httpOnly: true
        })
        .status(200).json({
            message: "Login successful",
            data: user
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const validToken = async(req: Request,res: Response)=>{
    return res.status(200);
}

export {signUp, login, validToken};