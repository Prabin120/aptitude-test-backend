import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import User from "../models/user";
import { getCoins } from "./rewardsController";

const profile = async(req:ICustomRequest, res:Response)=>{

    let {username} = req.query;
    if (!username) {
        username = req.username;
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }
    }
    try {
        const user = await User.findOne({username});
        if(!user){
            return res.status(400).json({message: "Username not found"});
        }
        const coins = await getCoins(user.username);
        return res.status(200).json({data:{...user.toJSON(), coins: coins?.balance??0}});
    } catch (error) {
        return res.status(500).json({message: "Server error"});
    }
}

const editProfile = async(req:ICustomRequest, res:Response)=>{
    const existingUsername = req.username;
    try {
        const {username, name, mobile, institute, bio, location, company, github, twitter, website} = req.body;
        const user = await User.findOne({username: existingUsername});
        if(!user){
            return res.status(403).json({message: "Not authorised"});
        }
        if(username && username !== user.username && await User.findOne({username})){
            return res.status(400).json({message: "Username already in use"})
        }
        user.username = username || user.username;
        user.name = name || user.name;
        user.mobile = mobile || user.mobile;
        user.institute = institute || user.institute;
        user.bio = bio || user.bio;
        user.location = location || user.location;
        user.company = company || user.company;
        user.github = github || user.github;
        user.twitter = twitter || user.twitter;
        user.website = website || user.website;
        await user.save();
        return res.status(200).json({message: "Profile updated successfully",
            data: user
        });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({message: "Server error"});
    }
}

export {profile, editProfile};