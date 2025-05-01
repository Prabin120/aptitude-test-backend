import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUser{
    readonly _id: string;
    username: string;
    name: string;
    email: string;
    password: string;
    institute?: string;
    mobile: string;
    role: string;
    image: string;
    bio?: string;
    memberSince?: string;
    rank?: string;
    location?: string;
    company?: string;
    github?: string;
    twitter?: string;
    website?: string;
    emailVerified?: boolean;
};

const userSchema = new mongoose.Schema<IUser>({
    _id:{ type: String, default: uuidv4 },
    username: { type:String, required: true, index:true, unique:true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    institute: { type: String },
    role: { type: String, default: 'user' },
    image: { type: String },
    bio: { type: String },
    memberSince: { type: String },
    rank: { type: String },
    location: { type: String },
    company: { type: String },
    github: { type: String },
    twitter: { type: String },
    website: { type: String },
    emailVerified: { type: Boolean, default: false },
}, {timestamps: true});

const User = mongoose.model<IUser>('User', userSchema);
export default User;