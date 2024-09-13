import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import User from "../models/user";
import bcrypt from 'bcrypt';

const profile = async(req:ICustomRequest, res:Response)=>{
    const userId = req.userId;
    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(403).json({message: "Not authorised"});
        }
        return res.status(200).json({data:user});
    } catch (error) {
        return res.status(500).json({message: "Server error"});
    }
}

const editProfile = async(req:ICustomRequest, res:Response)=>{
    const userId = req.userId;
    try {
        const {name, mobile, institute} = req.body;
        const user = await User.findById(userId);        
        if(!user){  
            return res.status(403).json({message: "Not authorised"});
        }
        if(user.mobile !== mobile && await User.findOne({mobile})){
            return res.status(400).json({message: "Mobile number already in use"})
        }
        user.name = name || user.name;
        user.mobile = mobile || user.mobile;
        user.institute = institute;
        await user.save();
        return res.status(200).json({message: "Profile updated successfully", data: user});
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({message: "Server error"});
    }
}

export {profile, editProfile};