import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import Feedback from "../models/feedback";
import { sendMailFeedbackResponse, sendMailGotFeedback } from "../utils/mailService";

const feedback = async(req:ICustomRequest, res:Response)=>{
    const {email, message, name, subject} = req.body;
    try {
        const feedback = await Feedback.create({email, message, name, subject});
        if(feedback){
            sendMailFeedbackResponse(name, email);
            sendMailGotFeedback(name, email, subject??"", message??"");
        }
        return res.status(200).json({message: "Feedback submitted successfully"});
    } catch (error) {
        return res.status(500).json({message: "Server error"});
    }
}

export default feedback