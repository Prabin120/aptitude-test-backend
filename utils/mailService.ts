import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
    forgotPasswordBody,
    forgotPasswordSubject,
} from "./mailTemplates/forgotPassword";
import {
    feedbackResponseBody,
    feedbackResponseSubject,
} from "./mailTemplates/feedbackResponse";
dotenv.config();

// Create a transporter object
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use SSL
    auth: {
        user: process.env.MAIL_ID,
        pass: process.env.APP_PASSWORD,
    },
});

// Configure the mailoptions object
const mailOptions = {
    from: process.env.MAIL_ID,
    to: process.env.PERSONAL_EMAIL_ID,
    subject: "",
    html: "",
};

const sendMailResetPasswordMail = async (
    receipantName: string,
    receipantMailId: string,
    resetLink: string
) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.to = receipantMailId;
        mailOptions.subject = forgotPasswordSubject;
        mailOptions.html = forgotPasswordBody(receipantName, resetLink);
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};
const sendMailGotFeedback = async (
    receipantName: string,
    receipantMailId: string,
    subject: string,
    message: string
) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.subject = "Feedback AptiTest";
        mailOptions.html = `
        Mail from ${receipantMailId}
        Name: ${receipantName}
        Feedback Subject: ${subject}
        Feedback Message: ${message}
      `;
    } catch (error) {
        console.log(error);
        return false;
    }
};
const sendMailFeedbackResponse = async (
    receipantName: string,
    receipantMailId: string
) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.to = receipantMailId;
        mailOptions.subject = feedbackResponseSubject;
        mailOptions.html = feedbackResponseBody(receipantName);
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

export {
    sendMailFeedbackResponse,
    sendMailGotFeedback,
    sendMailResetPasswordMail,
};
