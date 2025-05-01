import ICustomRequest from "../utils/customRequest";
import User from "../models/user";
import {sendQuestionApprovedMail, sendQuestionRejectedMail} from "../utils/mailService";
import { Response } from "express";
import { coinNosForCode, updateCoinTransaction } from "../utils/coinServices";

export const sentQuestionApprovedMail = async (req: ICustomRequest, res: Response) => {
    try {
        const { username, questionNo, questionTitle, questionType } = req.body;
        const user = await User.findOne({ username });
        if(!user){
            return res.status(400).json({ message: "User not found" });
        }
        if(["easy", "medium", "hard"].indexOf(questionType) === -1){
            return res.status(400).json({ message: "Invalid question type, please check"});
        }
        const coins = coinNosForCode.get(questionType) ?? 10;
        await updateCoinTransaction(coins, username, "success", "Question approved: " + questionNo + " " + questionTitle, "earning");
        await sendQuestionApprovedMail(user.name, user.email, questionNo, questionTitle);
        return res.status(200).json({ message: "Mail sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

export const sentQuestionRejectedMail = async (req: ICustomRequest, res: Response) => {
    try {
        const { username, questionNo, questionTitle, feedback } = req.body;
        const user = await User.findOne({ username });
        if(!user){
            return res.status(400).json({ message: "User not found" });
        }
        await sendQuestionRejectedMail(user.name, user.email, questionNo, questionTitle, feedback);
        return res.status(200).json({ message: "Mail sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}
