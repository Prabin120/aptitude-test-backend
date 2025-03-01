import dotenv from "dotenv";
import Queue from "bull";
import { transporter } from "./mailService";
import { groupTestBody, groupTestSubject } from "./mailTemplates/groupTestTemplate";
import GroupTestMailStatus from "../models/groupTestMailStatus";
import dns from 'dns/promises';

dotenv.config();
const CLIENT_DOMAIN_URL = process.env.CLIENT_DOMAIN_URL as string;

const emailQueue = new Queue('emails');

// Validate email format and domain existence
async function validateEmail(email: string): Promise<boolean> {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    try {
        const domain = email.split('@')[1];
        await dns.resolveMx(domain);
        return true;
    } catch (error) {
        return false;
    }
}
// Process emails from the queue
emailQueue.process(async (job) => {
    const { testId, to, subject, html, resend } = job.data;
    try {
        const isValid = await validateEmail(to);
        if (!isValid) {
            throw new Error(`Invalid email address: ${to}`);
        }
        await transporter.sendMail({
            from: process.env.MAIL_ID,
            to,
            subject,
            html
        });
        if (!resend) await GroupTestMailStatus.create({ email: to, status: 'sent', test: testId });
        else await GroupTestMailStatus.findOneAndUpdate({ email: to, test: testId }, { status: 'sent' });
    } catch (error) {
        if (!resend) await GroupTestMailStatus.create({ email: to, status: 'failed', test: testId });
        else await GroupTestMailStatus.findOneAndUpdate({ email: to, test: testId }, { status: 'failed' });
    }
});

// Add emails to the queue
export function sendGroupTestMail(recipients: string[], testId: string, resend = false) {
    recipients.forEach(recipient => {
        emailQueue.add({
            testId: testId,
            to: recipient,
            subject: groupTestSubject,
            html: groupTestBody(`${CLIENT_DOMAIN_URL}/group-test/add-me?testId=` + testId),
            resend: resend
        }).catch(err => {
            console.error(`Error adding job for ${recipient}:`, err);
        });
    });

    emailQueue.on('failed', (job, err) => {
        console.error(`Job failed for email: ${job.data.to}`, err);
    });

    emailQueue.on('completed', (job) => {
        console.log(`Job completed for email: ${job.data.to}`);
    });
}
