import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import UserTest from "../models/userTest";
import Test from "../models/tests";
import Question from "../models/questions";
import axios from "axios";
import { gettingQuestionsForTest, goServer } from "../consts";
import { IUser } from "../models/user";

const markCalculations = async (answers: any, testId: string) => {
    let totalMarks = 0;
    let correctMarks = 0;
    const test = await Test.findById(testId);
    const questions = await Question.find({questionNo: {$in: test?.apti_list}});
    questions.forEach((question: any) => {
        const answer = answers? answers[question._id]: null;
        const correctAnswer = question.answer;
        if(answer){
            if (Array.isArray(answer) ? JSON.stringify(answer.sort()) === JSON.stringify(correctAnswer.sort()) : answer === correctAnswer[0]) {
                correctMarks += question.marks;
            }
        }
        totalMarks += question.marks;
    });
    return [correctMarks, totalMarks];
}

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
        if(userTest){
            return res.status(200).json({message: "You have already attempted this test"});
        }
        const test = await Test.findById(testId);
        if(!test){
            return res.status(404).json({message: "Test not found"});
        }
        const endTime = test.endDateTime;
        if(endTime && endTime.getTime() < Date.now()){
            return res.status(400).json({message: "Submit failed due to late submission"});
        }
        let [correctMarks, totalMarks] = await markCalculations(aptitudeAnswers, testId as string);
        const codingMarks = test.codingMarks?.split(",").map((mark: string) => parseInt(mark.trim()));
        codingAnswers.forEach((question: { passedTestCases: number; totalTestCases: number; questionNo: string;}) => {
            const ind = test.code_list?.indexOf(question.questionNo);
            const marks = codingMarks?.[ind??0]
            const ratio = question.passedTestCases/question.totalTestCases
            if(marks && ratio){
                correctMarks += (marks*ratio)
                totalMarks += marks
            }            
        })
        await UserTest.create({
            user: userId,
            test: testId,
            aptitudeAnswers: aptitudeAnswers??{},
            codingAnswers: codingAnswers??[],
            attempted: true,
            marksAchieved: correctMarks??0,
            totalMarks
        })
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
        const startDateTime = new Date(data.dateTime);
        const endDateTime = startDateTime.getTime() + data.duration * 1000 * 60;
        const response = await Test.create({ ...data, startDateTime, endDateTime });
        return res
            .status(200)
            .json({ message: "Test set successfully", data: response });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getTests = async (req: ICustomRequest, res: Response) => {
    try {
        const currentTime = Date.now();
        const ongoingTests = await Test.find({
            startDateTime: { $lt: currentTime },
            endDateTime: { $gt: currentTime },
            },
            "slug title startDateTime endDateTime duration description type"
        );
        const upcomingTests = await Test.find({
            startDateTime: { $gte: currentTime },
            },
            "slug title startDateTime endDateTime duration description type"
        );
        const pastTests = await Test.find({ endDateTime: { $lt: currentTime } },
            "slug title startDateTime endDateTime duration description type"
        )
            .sort({ createdAt: -1 })
            .limit(5);
        return res.status(200).json({ upcomingTests, pastTests, ongoingTests });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getSingleTest = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params;
        const { onlyApti } = req.query;
        const test = await Test.findOne({ slug });
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        const codeIds = test?.code_list;
        const aptiIds = test?.apti_list;
        const aptiQuestions = await Question.find({ questionNo: { $in: aptiIds } },
            "_id slug title type options"
        );
        aptiQuestions.forEach((questions)=>{
            questions.questionKind = "aptitude";
        })
        let codingQuestions;
        codeIds && !onlyApti && await axios
            .post(goServer + gettingQuestionsForTest, { questions: codeIds })
            .then((response) => {
                codingQuestions = response.data.data;
                codingQuestions.forEach((question:any) => {
                    question.questionKind = "coding";
                });
            })
            .catch((error) => {
                console.log(error);
            });
        return res.status(200).json({ test, codingQuestions, aptiQuestions });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const examTestReport = async (req: ICustomRequest, res: Response) => {
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
        })
        .sort({ marksAchieved: -1 });
        return res.status(200).json({
            data: userTest.map(item => ({
                marksAchieved: item.marksAchieved,
                name: item.user.name, // Access the populated name
            }))
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export { validateTestQuestion, createTest, getTests, getSingleTest, submitTest, examTestReport };
