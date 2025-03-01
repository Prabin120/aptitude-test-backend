import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import UserTest, { IUserTest } from "../models/userTest";
import Test from "../models/tests";
import Question from "../models/questions";
import { REDIS_EXPIRY } from "../consts";
import { IUser } from "../models/user";
import client from "../utils/redis";
import { clearCache } from "../middlewares/cache";
import { createOrder, verifyPayment } from "./paymentController";
import Payment from "../models/payment";
import GroupTest from "../models/groupTest";
import { markCalculations } from "./groupTestController";

const validateTestQuestion = async (req: ICustomRequest, res: Response) => {
    const { apti } = req.body;
    let missingAptiIds: string[] = [];
    try {
        const results = await Question.find({ questionNo: { $in: apti } });
        const foundIds = results.map((doc) => doc.questionNo.toString());
        missingAptiIds = apti.filter((id: string) => !foundIds.includes(id));
    } catch (err) {
        console.error("Error fetching questions:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    const valid = missingAptiIds.length === 0;
    return res.status(200).json({ valid, missingAptiIds });
};

const submitTest = async(req:ICustomRequest, res:Response)=>{
    try {
        const userId = req.userId;
        const {aptitudeAnswers, codingAnswers, testId} = req.body;
        const userTest = await UserTest.findOne({ user: userId, test: testId});
        if(!userTest){
            return res.status(404).json({message: "Test not found"});
        }
        if(userTest.attempted){
            return res.status(200).json({message: "You have already attempted this test"});
        }
        const test = await Test.findById(testId);
        if(!test){
            return res.status(404).json({message: "Test not found"});
        }
        const endTime = test.endDateTime;
        const extraTimeToSubmit = 1000*60*2;
        if(endTime && endTime.getTime() + extraTimeToSubmit < Date.now()){
            return res.status(400).json({message: "Submit failed due to late submission"});
        }
        const [correctMarks, totalMarks] = await markCalculations(aptitudeAnswers, codingAnswers, test);
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

const createTest = async (req: ICustomRequest, res: Response) => {
    try {
        const data = req.body;
        if (!data.title || !data.description || !data.duration) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const isExists = await Test.findOne({ title: data.title });
        if (isExists) {
            return res.status(400).json({ message: "Test title already exists" });
        }
        if(data.type === "exam" && (!data.amount || data.amount <= 0)){
            return res.status(400).json({ message: "Amount is required for exam type test" });
        }
        const startDateTime = new Date(data.startDateTime);
        const endDateTime = startDateTime.getTime() + data.duration * 1000 * 60;
        const response = await Test.create({ ...data, startDateTime, endDateTime });
        await clearCache("getTests");
        return res
            .status(200)
            .json({ message: "Test set successfully", data: response });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getAllTests = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    try {
        const tests = await Test.find({startDateTime: {$gt: new Date()}}, 
        "_id title slug description startDateTime endDateTime duration type amount"
        ).sort({ startDateTime: 1 });
        let testsWithUserStatus;
        if(userId){
            const testIds = tests.map((test)=>test._id);
            const userTests = await UserTest.find({ user: userId, test: {$in: testIds} });
            const registeredTests = new Map(userTests.map((userTest)=>[userTest.test.toString(), true]));
            testsWithUserStatus = tests.map((test) => {
                return {
                    ...test.toObject(),
                    registered: userId? registeredTests.has(test._id.toString()): false
                };
            });
        } else{
            testsWithUserStatus = tests
        }
        
        return res.status(200).json({ tests: testsWithUserStatus });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getMyTests = async (req: ICustomRequest, res: Response) => {
    try {
        const userId = req.userId;
        const userTests = await UserTest.find({ user: userId },
                "test attempted"
            )
            .populate('test', 'title slug description startDateTime endDateTime duration type') // Select necessary fields from Test schema
            .exec();
        const currentTime = new Date();

        const upcomingTests: IUserTest[] = [];
        const ongoingTests: IUserTest[] = [];
        const pastTests: IUserTest[] = [];

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
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch user tests' });
    }
};

const getSingleTest = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    try {
        const { slug } = req.params;
        const { onlyApti } = req.query;
        let testIds = [];
        let test;
        if (onlyApti === "true") {
            test = await Test.findOne({ slug }, "apti_list");
            testIds = test?.apti_list?.map((question: any) => question._id)??[];
        } else{
            test = await Test.findOne({ slug });
            testIds = test?.apti_list?.map((question: any) => question._id)??[];
        }
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        let aptiQuestions;
        if(onlyApti === "true" && testIds?.length > 0){
            aptiQuestions = await Question.find({ _id: { $in: testIds } },
                "_id slug title type options"
        )}
        await client.set(key, JSON.stringify({ data:test, aptiQuestions }), {EX: REDIS_EXPIRY});
        return res.status(200).json({ data:test, aptiQuestions });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getGroupTest = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    try {
        const { testId } = req.params;
        const test = await GroupTest.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        const aptiIds = test?.apti_list?.map((question: any) => question._id);
        const aptiQuestions = await Question.find({ _id: { $in: aptiIds } },
            "_id slug title type options"
        );
        await client.set(key, JSON.stringify(aptiQuestions), {EX: REDIS_EXPIRY});
        return res.status(200).json(aptiQuestions);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
}; 

const examTestReport = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    const { slug } = req.params;    
    try {
        const test = await Test.findOne({ slug });
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        const userTest = await UserTest.find(
            { test: test._id },
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

const registerTest = async (req: ICustomRequest, res: Response) => {
    const userId = req.userId;
    try {
        const { testId } = req.body
        const test = await Test.findById(testId)
        if(!test){
            return res.status(400).json({message: "Test is not found"})
        }
        const userTest = await UserTest.findOne({user: req.userId, test: testId})
        if(userTest){
            return res.status(400).json({message: "you are already registered"})
        }
        if(test.type === 'practice'){
            await UserTest.create({ user: userId, test: testId, paid: true })
            return res.status(200).json({message: "Registration is SuccessFull"})
        }
        const options = {
            amount: test.amount*100,
            currency: "INR",
            receipt: `order_${Date.now()}`,
        }
        const orderId = await createOrder(options)
        if (!orderId) {
            return res.status(400).json({ message: "Something went wrong" });
        }
        return res.status(200).json({
            success: true,
            msg: "Order Created",
            order_id: orderId,
            amount: options.amount,
            product_name: "AptiCode",
        })
    } catch (error) {
        console.log(error);
        return {test: "", options: {}}
    }
};

const verifyTestPayment = async(req: ICustomRequest, res: Response)=>{
    const userId = req.userId;
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, testId } = req.body
        const payment = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        if (payment === undefined){
            return res.status(400).json({status: "failed", error: "Payment verification failed"})
        }
        await Payment.create({ user: userId, paymentId: razorpay_payment_id, paymentMethod: "razorpay", 
            amount: payment.amount, paymentObject: payment, description: payment.description })
        await UserTest.create({ user: userId, test: testId, paid: true })
        return res.status(200).json({message: "Registration successfull"})
    } catch (error) {
        return res.status(400).json({message: "Server error"})
    }
}

export { validateTestQuestion, createTest, getMyTests, getSingleTest, submitTest, examTestReport, getAllTests, 
    registerTest, verifyTestPayment, getGroupTest };
