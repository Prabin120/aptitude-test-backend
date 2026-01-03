import { Resend } from "resend";
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

const resend = new Resend(process.env.RESEND_API_KEY);

const fromInfo = `AptiCode Info <info@apticode.in>`;
const fromSupport = `AptiCode Support <support@apticode.in>`;

const sendMail = async (from: string, to: string, subject: string, html: string) => {
    if (!to) return false;
    try {
        await resend.emails.send({ from, to, subject, html });
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

const sendMailResetPasswordMail = async (
    receipantName: string,
    receipantMailId: string,
    resetLink: string
) => {
    const html = forgotPasswordBody(receipantName, resetLink);
    return sendMail(fromSupport, receipantMailId, forgotPasswordSubject, html);
};

const sendMailGotFeedback = async (
    receipantName: string,
    receipantMailId: string,
    subject: string,
    message: string
) => {
    const html = `
        Mail from ${receipantMailId}<br>
        Name: ${receipantName}<br>
        Feedback Subject: ${subject}<br>
        Feedback Message: ${message}
    `;
    const personalEmail = process.env.PERSONAL_EMAIL_ID as string;
    return sendMail(fromInfo, personalEmail, "Feedback AptiCode", html);
};

const sendMailFeedbackResponse = async (
    receipantName: string,
    receipantMailId: string
) => {
    const html = feedbackResponseBody(receipantName);
    return sendMail(fromSupport, receipantMailId, feedbackResponseSubject, html);
};

const requestingForCreatorAccess = async (receipantMailId: string, username: string) => {
    const html = `
        Mail from ${receipantMailId}<br>
        Username: ${username}
    `;
    const personalEmail = process.env.PERSONAL_EMAIL_ID as string;
    return sendMail(fromInfo, personalEmail, "Request for Creator Access", html);
};

const sentEmailVerificationMail = async (name: string, receipantMailId: string, link: string) => {
    const html = `
        <h1>Hello ${name},</h1>
        <p>Click on the link to verify your email address:</p>
        <a href="${link}">Verify Email</a>
    `;
    return sendMail(fromSupport, receipantMailId, "Email Verification", html);
};

const sendQuestionApprovedMail = async (receipantName: string, receipantMailId: string, questionNo: number, questionTitle: string) => {
    const html = `
        Hi, ${receipantName},<br>
        Your question has been approved and is live now. Your coins will be added to your wallet soon.<br><br>
        Question No: ${questionNo}<br>
        Question Title: ${questionTitle}
    `;
    return sendMail(fromInfo, receipantMailId, "Question Approved", html);
}

const sendQuestionRejectedMail = async (receipantName: string, receipantMailId: string, questionNo: number, questionTitle: string, feedback: string) => {
    const html = `
        Hi, ${receipantName},<br>
        Your question has been rejected by our team.<br>
        Please follow the feedback and resend it again.<br>
        Feedback: <br>
        ${feedback}<br><br>
        Question No: ${questionNo}<br>
        Question Title: ${questionTitle}
    `;
    return sendMail(fromInfo, receipantMailId, "Question Rejected", html);
}

export {
    sendMail,
    sendMailFeedbackResponse,
    sendMailGotFeedback,
    sendMailResetPasswordMail,
    requestingForCreatorAccess,
    sentEmailVerificationMail,
    sendQuestionApprovedMail,
    sendQuestionRejectedMail,
};
