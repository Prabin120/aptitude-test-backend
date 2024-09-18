import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  forgotPasswordBody,
  forgotPasswordSubject,
} from "./mailTemplates/forgotPassword";
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
  to: "",
  subject: "",
  html: "",
};

const sendMail = async (name: string, mailId: string, template: string, resetLink: string) => {
  if (!mailId || !template) {
    return false;
  }
  try {
    if (template === "forgotPassword") {
      mailOptions.to = mailId;
      mailOptions.subject = forgotPasswordSubject;
      mailOptions.html = forgotPasswordBody(name, resetLink);
      const info = await transporter.sendMail(mailOptions);
    //   console.log("Email sent: " + info.response);
      return true;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

export default sendMail;
