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
        return decodedToken;
    } catch (error) {
        return
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
        const username = decodedToken?.username;
        if(!username){
          res.status(401).json({ message: 'Authentication failed'});
          return;
        }
        req.username = username;
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
        } else{
            const decodedToken = verifyToken(token);
            const username = decodedToken?.username;
            req.username = username;
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
        // res.clearCookie('access_token', { httpOnly: true});
        return;
    }
    try {
        const decodedToken = verifyToken(token);
        const username = decodedToken?.username;
        const user = await User.findOne({username});
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            // res.clearCookie('access_token', { httpOnly: true});
            return;
        }
        if (user.role !== "admin") {
            res.status(400).json({ message: "Only admin can use the calls" });
            return;
        }
        req.username = username;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: (error as Error).message });
        // res.clearCookie('access_token', { httpOnly: true});
        return;
    }
};

export { authenticate, adminAuthentication, verifyToken, authenticateWithoutReturn };