import jwt from 'jsonwebtoken'
import User from '../models/user';
import dotenv from 'dotenv';
import { Response, NextFunction } from 'express';
import ICustomRequest from '../utils/customRequest';

dotenv.config();
const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY as string;

interface DecodedToken{
    username: string;
    role: string;
    name: string;
}
const verifyToken = (token: string) => {
    try {
        const decodedToken = jwt.verify(token, JWT_ACCESS_SECRET_KEY) as DecodedToken;
        if (!decodedToken || !decodedToken.username || !decodedToken.role || !decodedToken.name) {
            return undefined;
        }
        return decodedToken;
    } catch (error) {
        return undefined;
    }
};

const authenticate = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const decodedToken = verifyToken(token);
        if (!decodedToken) {
            res.status(401).json({ message: 'Authentication failed' });
            return;
        }
        req.username = decodedToken.username;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: (error as Error).message });
        return;
    }
};

const authenticateWithoutReturn = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.access_token;
        req.username = "";
        if (!token) {
            next();
        } else {
            const decodedToken = verifyToken(token);
            if (decodedToken) {
                req.username = decodedToken.username;
            }
            next();
        }
    } catch (error) {
        console.error(error);
        next();
    }
};

const adminAuthentication = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies.access_token;    
    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    try {
        const decodedToken = verifyToken(token);
        if (!decodedToken) {
            res.status(401).json({ message: 'Authentication failed' });
            return;
        }
        
        const role = decodedToken.role;
        if (role !== "admin") {
            res.status(400).json({ message: "Only admin can use the calls" });
            return;
        }
        
        req.username = decodedToken.username;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: (error as Error).message });
        return;
    }
};

export { authenticate, adminAuthentication, verifyToken, authenticateWithoutReturn };