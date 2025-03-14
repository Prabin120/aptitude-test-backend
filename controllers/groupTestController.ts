import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import GroupTest, { IGroupTest } from "../models/groupTest";
import { createOrder, verifyPayment } from "./paymentController";
import Payment from "../models/payment";
import {sendGroupTestMail} from "../utils/groupTestMail"
import GroupTestMailStatus from "../models/groupTestMailStatus";
import UserGroupTest, { IGroupUserTest } from "../models/userGroupTest";
import User, { IUser } from "../models/user";
import Question from "../models/questions";
import { REDIS_EXPIRY } from "../consts";
import client from "../utils/redis";
import { ITest } from "../models/tests";
import { clearCache } from "../middlewares/cache";

const createGroupTest = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    try {
        const data = req.body;
        if (!data.title || !data.description || !data.duration || !data.participants || !data.totalParticipants) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const participants = [...new Set(data.participants)]
        const totalParticipants = Number(data.totalParticipants);
        if(3 > totalParticipants|| totalParticipants > 50){
            return res.status(400).json({message: "Number of Participants should be between 3 and 50"})
        }
        if(participants.length > totalParticipants){
            return res.status(400).json({message: "Number of Participants entered should be equal or less than Participants No"})
        }
        const options = {
            amount: totalParticipants * 20 * 100,
            currency: "INR",
            receipt: `order_${Date.now()}`,
        }
        const orderId = await createOrder(options)
        const startDateTime = new Date(data.startDateTime);
        const endDateTime = startDateTime.getTime() + data.duration * 1000 * 60;
        await GroupTest.create({ ...data, amount: options.amount, totalParticipants, participants, orderId: orderId, paid: false, organizer: userId, startDateTime, endDateTime });
        return res.status(200).json({
            success: true,
            msg: "Order Created",
            order_id: orderId,
            amount: options.amount,
            product_name: "AptiCode",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
}

const verifyGroupTestPayment = async (req: ICustomRequest, res:Response) =>{
    const userId = req.userId;
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body
        const payment = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        if (payment === undefined){
            return res.status(400).json({status: "failed", error: "Payment verification failed"})
        }
        await Payment.create({ user: userId, paymentId: razorpay_payment_id, paymentMethod: "razorpay", amount: payment.amount, 
            paymentObject: payment, description: payment.description })
        const groupTest = await GroupTest.findOne({orderId: orderId, organizer: userId})
        if(!groupTest){
            return res.status(400).json({message: "Something went wrong"})
        }
        groupTest.paid = true;
        groupTest.save();
        sendGroupTestMail(groupTest.participants, groupTest._id);
        return res.status(200).json({message: "Registration successfull"})
    } catch (error) {
        return res.status(400).json({message: "Server error"})
    }
}

const addPaticipants = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    try {
        const {testId} = req.query;
        const isExists = await UserGroupTest.findOne({ user: userId, test: testId });
        if (isExists) {
            return res.status(400).json({ message: "You have already registered" });
        }
        const user = await User.findById(userId).select("email").exec();
        const groupTest = await GroupTestMailStatus.findOne({ test: testId, email: user?.email });
        if (!groupTest) {
            return res.status(400).json({ message: "Either you are not invited or Invalid Group Test" });
        }
        await UserGroupTest.create({ user: userId, test: testId});
        return res.status(200).json({ message: "Registration successfull" });
    } catch (error) {
        return res.status(400).json({ message: "Server error" });
    }
}

const getGroupTests = async( req: ICustomRequest, res: Response ) =>{
    try {
        const userId = req.userId;
        const userTests = await UserGroupTest.find({ user: userId },
                "test attempted"
            )
            .sort({ createdAt: -1 })
            .populate('test', 'title slug description startDateTime endDateTime duration')
            .exec();
        const currentTime = new Date();

        const upcomingTests: IGroupUserTest[] = [];
        const ongoingTests: IGroupUserTest[] = [];
        const pastTests: IGroupUserTest[] = [];

        userTests.forEach((userTest) => {
            const test = userTest.test as any; // Cast to access test details
            if (test) {
                const { startDateTime, endDateTime } = test;
                if (startDateTime > currentTime) {
                    upcomingTests.push(test);
                } else if (endDateTime && endDateTime > currentTime) {
                    ongoingTests.push({...test.toObject(), attempted: userTest.attempted});
                } else {
                    pastTests.push(test);
                }
            }
        });

        return res.status(200).json({ upcomingTests, pastTests, ongoingTests });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const getSingleTest = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    try {
        const { testId } = req.params;
        const test = await GroupTest.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        await client.set(key, JSON.stringify({data: test}), {EX: REDIS_EXPIRY});
        return res.status(200).json({data: test});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getGroupTestMailStatus = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    const { testId } = req.query;
    try {
        const groupTest = await GroupTest.findById(testId);
        if (!groupTest || groupTest.organizer !== userId) {
            return res.status(400).json({ message: "Invalid Group Test" });
        }
        const emailStatus = await GroupTestMailStatus.find({ test: testId },
            "email status"
        );
        return res.status(200).json({ data:emailStatus });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}


const getOwnedGroupTests = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    try {
        const groupTests = await GroupTest.find({ organizer: userId, paid: true },
            "_id title startDateTime endDateTime"
        )
        .sort({ createdAt: -1 });
        return res.status(200).json({ groupTests });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const getDetailGroupTest = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    const userId = req.userId;
    const { testId } = req.params;
    try {
        const groupTest = await GroupTest.findById(testId);
        if (!groupTest || groupTest.organizer !== userId) {
            return res.status(400).json({ message: "Invalid Group Test" });
        }
        return res.status(200).json({ groupTest });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const resendMail = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    const { testId } = req.query;
    try {
        const groupTest = await GroupTest.findById(testId);
        if (!groupTest || groupTest.organizer !== userId) {
            return res.status(400).json({ message: "Invalid Group Test" });
        }
        const failedEmails = await GroupTestMailStatus.find({ test: testId, status: "failed" })
            .select("email")
            .exec();
        
        const emailAddresses = failedEmails.map(emailDoc => emailDoc.email);
        sendGroupTestMail(emailAddresses, groupTest._id, true);
        return res.status(200).json({ groupTest });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const modifyGroupTest = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    const { testId } = req.params;
    const data = req.body;
    const key = req.originalUrl;
    try {
        const groupTest = await GroupTest.findById(testId);
        if (!groupTest || groupTest.organizer !== userId) {
            return res.status(400).json({ message: "Invalid Group Test" });
        }
        const currentTime = new Date();
        if(currentTime >= groupTest.startDateTime){
            return res.status(400).json({ message: "You Can't change passed or ongoing test Time" });
        }
        if(data.addParticipants){
            const newParticipants = data.addParticipants.split(",").map((p: string) => p.trim());
            const diff = Number(groupTest.totalParticipants) - (groupTest.participants.length)
            if(diff < newParticipants.length){
                return res.status(400).json({ message: `Total participants exceeded, you are trying to add ${newParticipants.length} participants but only ${Math.abs(diff)} are left` });
            }
            let participants = groupTest.participants
            participants.push(...newParticipants)
            groupTest.participants = [...new Set(participants)]
            sendGroupTestMail(newParticipants, groupTest._id);
        }
        if(data.duration || data.startDateTime){
            
            if(data.duration && data.startDateTime){
                const startDateTime = new Date(data.startDateTime)
                groupTest.startDateTime = startDateTime
                groupTest.endDateTime = new Date(startDateTime.getTime() + data.duration * 1000 * 60);
                groupTest.duration = data.duration
            }
            else if(data.duration){
                groupTest.endDateTime = new Date(groupTest.startDateTime.getTime() + data.duration * 1000 * 60);
                groupTest.duration = data.duration
            }
            else if(data.startDateTime){
                groupTest.startDateTime = new Date(data.startDateTime);
                groupTest.endDateTime = new Date(groupTest.startDateTime.getTime() + groupTest.duration * 1000 * 60);
            }
        }
        if(data.description) groupTest.description = data.description;
        groupTest.code_list = data.code_list
        groupTest.apti_list = data.apti_list
        await groupTest.save();
        clearCache(key);
        return res.status(200).json({ groupTest });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

const editEmail = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    const { testId } = req.query;
    const { _id, email } = req.body;
    try {
        const groupTest = await GroupTest.findById(testId);
        if (!groupTest || groupTest.organizer !== userId) {
            return res.status(400).json({ message: "Invalid Group Test" });
        }
        const isEmailExist = groupTest.participants.includes(email);
        if (isEmailExist) {
            return res.status(400).json({ message: "Email already exist" });
        }
        const emailStatus = await GroupTestMailStatus.findById(_id);
        if (!emailStatus || emailStatus.test !== testId) {
            return res.status(400).json({ message: "Invalid email" });
        }
        if(emailStatus.status === "sent"){
            return res.status(400).json({ message: "Email already sent, You can sent the link directly to the participants to register" });
        }
        const oldEmail = emailStatus.email
        emailStatus.email = email;
        emailStatus.status = "pending";
        groupTest.participants.splice(groupTest.participants.indexOf(oldEmail), 1, email);
        await emailStatus.save();
        await groupTest.save();
        sendGroupTestMail([email], groupTest._id, true);
        return res.status(200).json({ groupTest });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const examTestReport = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    const { testId } = req.params;
    try {
        const userTest = await UserGroupTest.find(
            { test: testId },
            "marksAchieved"
        )
        .populate<{ user: Pick<IUser, "name"> }>({
            path: "user", // Populate the 'user' reference
            select: "name", // Fetch only the 'name' field from User
            match: { name: { $exists: true } }
        })
        .sort({ marksAchieved: -1 });
        const data = userTest?.map(item => ({
            marksAchieved: item.marksAchieved,
            name: item?.user?.name, // Access the populated name
        }))
        await client.set(key, JSON.stringify({data}), {EX: REDIS_EXPIRY});
        return res.status(200).json({data});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};


const markCalculations = async (aptitudeAnswers: any, codingAnswers: any, test: IGroupTest | ITest) => {
    let totalMarks = 0;
    let correctMarks = 0;
    
    //Calculating aptitude marks
    const questionIdns = test?.apti_list?.map((question: any) => question._id);
    const testMarks = test.apti_list
    const questions = await Question.find({_id: {$in: questionIdns}});
    const aptitude: any = {};
    (aptitudeAnswers as { answer: number | [number]; questionNo: string; }[])?.forEach((question: { answer: number | number[]; questionNo: string; }) => {
        aptitude[question.questionNo] = question.answer
    });
    questions.forEach((question: any) => {
        let answer = aptitude[question._id];
        const correctAnswer = question.answers;
        if(answer){
            if(!Array.isArray(answer)){
                answer = [answer];
            }
            if (JSON.stringify(answer.sort()) === JSON.stringify(correctAnswer.sort())) {
                const testMark = testMarks?.find((item: any) => item?._id.toString() === question?._id.toString());
                correctMarks += (testMark as { marks: number })?.marks ?? 0;
            }
        }
        totalMarks += question.marks;        
    });

    //Calculating coding marks
    test.code_list?.forEach((question: any) => {
        const code = codingAnswers.find((item: any) => item.questionNo === question._id);
        if(code){
            const ratio = code.passedTestCases/code.totalTestCases;
            if(question.marks && ratio){
                correctMarks += (question.marks*ratio)
            }
        }
        totalMarks += question.marks;
    });
    return [correctMarks, totalMarks];
}

const submitTest = async(req:ICustomRequest, res:Response)=>{
    try {
        const userId = req.userId;
        const {aptitudeAnswers, codingAnswers, testId} = req.body;
        const userTest = await UserGroupTest.findOne({ user: userId, test: testId});
        if(!userTest){
            return res.status(404).json({message: "Test not found"});
        }
        if(userTest.attempted){
            return res.status(200).json({message: "You have already attempted this test"});
        }
        const test = await GroupTest.findById(testId);
        if(!test){
            return res.status(404).json({message: "Test not found"});
        }
        const endTime = test.endDateTime;
        const extraTimeToSubmit = 1000*60*2;
        if(endTime && endTime.getTime() + extraTimeToSubmit < Date.now()){
            return res.status(400).json({message: "Submit failed due to late submission"});
        }
        let [correctMarks, totalMarks] = await markCalculations(aptitudeAnswers, codingAnswers, test);
        userTest.attempted = true;
        userTest.marksAchieved = correctMarks??0;
        userTest.totalMarks = totalMarks;
        userTest.aptitudeAnswers = aptitudeAnswers??[];
        userTest.codingAnswers = codingAnswers??[];
        await userTest.save();
        return res.status(200).json({message: "Test submitted successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Server error"});
    }
}

export {createGroupTest, verifyGroupTestPayment, getGroupTests, getGroupTestMailStatus, 
    addPaticipants, getOwnedGroupTests, getDetailGroupTest, submitTest, examTestReport,
    resendMail, modifyGroupTest, editEmail, getSingleTest, markCalculations
}
