import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUser{
    readonly _id: string;
    name: string;
    email: string;
    password: string;
    institute?: string;
    mobile: string;
    role: 'user' | 'admin';
    image: string;
};

const userSchema = new mongoose.Schema<IUser>({
    _id:{ type: String, default: uuidv4 },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    institute: { type: String },
    role: { type: String, enum:['user', 'admin'], default: 'user' },
    image: { type: String }
}, {timestamps: true});

const User = mongoose.model<IUser>('User', userSchema);
export default User;