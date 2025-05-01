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
export const transporter = nodemailer.createTransport({
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
        transporter.sendMail(mailOptions);
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
        mailOptions.to = process.env.PERSONAL_EMAIL_ID;
        mailOptions.subject = "Feedback AptiCode";
        mailOptions.html = `
            Mail from ${receipantMailId}
            Name: ${receipantName}
            Feedback Subject: ${subject}
            Feedback Message: ${message}
        `;
        const info = await transporter.sendMail(mailOptions);
        return true;
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

const requestingForCreatorAccess = async (receipantMailId: string, username: string) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.to = process.env.PERSONAL_EMAIL_ID;
        mailOptions.subject = "Request for Creator Access";
        mailOptions.html = `
            Mail from ${receipantMailId}
            Username: ${username}
        `;
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const sentEmailVerificationMail = async (name: string, receipantMailId: string, link: string) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.to = receipantMailId;
        mailOptions.subject = "Email Verification";
        mailOptions.html = `
            <h1>Hello ${name},</h1>
            <p>Click on the link to verify your email address:</p>
            <a href="${link}">Verify Email</a>
        `;
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const sendQuestionApprovedMail = async (receipantName: string, receipantMailId: string, questionNo: number, questionTitle: string) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.to = receipantMailId;
        mailOptions.subject = "Question Approved";
        mailOptions.html = `
            Hi, ${receipantName},
            Your question has been approved and live now. Your coins will be added to your wallet soon.

            Question No: ${questionNo}
            Question Title: ${questionTitle}
        `;
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const sendQuestionRejectedMail = async (receipantName: string, receipantMailId: string, questionNo: number, questionTitle: string, feedback: string) => {
    if (!receipantMailId) {
        return false;
    }
    try {
        mailOptions.to = receipantMailId;
        mailOptions.subject = "Question Rejected";
        mailOptions.html = `
            Hi, ${receipantName},
            Your question has been rejected by our team.
            Please follow the feedback and resend it again.
            Feedback: 
            ${feedback}


            Question No: ${questionNo}
            Question Title: ${questionTitle}
        `;
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export {
    sendMailFeedbackResponse,
    sendMailGotFeedback,
    sendMailResetPasswordMail,
    requestingForCreatorAccess,
    sentEmailVerificationMail,
    sendQuestionApprovedMail,
    sendQuestionRejectedMail,
};
