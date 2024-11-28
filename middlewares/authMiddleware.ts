import jwt from 'jsonwebtoken'
import User from '../models/user';
import dotenv from 'dotenv';
import { Response, NextFunction } from 'express';
import ICustomRequest from '../utils/customRequest';

dotenv.config();
const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY as string;

interface DecodedToken{
    userId: string;
}
const verifyToken = async(token: string) => {
    try {
        const decodedToken = jwt.verify(token, JWT_ACCESS_SECRET_KEY) as DecodedToken;
        return decodedToken.userId;
    } catch (error) {
        return
    }
};

const authenticate = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            // res.clearCookie('access_token', { httpOnly: true});
            return;
        }
        const userId = await verifyToken(token);
        if(!userId){
          res.status(401).json({ message: 'Authentication failed'});
        //   res.clearCookie('access_token', { httpOnly: true});
          return;
        }
        req.userId = userId;
        next();
    } catch (error) {
        console.error(error);
        // res.clearCookie('access_token', { httpOnly: true});
        res.status(401).json({ message: (error as Error).message });
        return;
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
        const userId = await verifyToken(token);
        const user = await User.findById(userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            // res.clearCookie('access_token', { httpOnly: true});
            return;
        }
        if (user.role !== "admin") {
            res.status(401).json({ message: "Only admin can use the calls" });
            return;
        }
        req.userId = userId;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: (error as Error).message });
        // res.clearCookie('access_token', { httpOnly: true});
        return;
    }
};

export { authenticate, adminAuthentication };