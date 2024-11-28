import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import UserTest from "../models/userTest";
import Test from "../models/tests";
import Question from "../models/questions";

const markCalculations = async (answers: any, testId: string) => {
    let totalMarks = 0;   
    let correctMarks = 0;
    const test = await Test.findById(testId);
    const questions = await Question.find({questionNo: {$in: test?.questions}});
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

const getTest = async(req:ICustomRequest, res:Response)=>{
    const userId = req.userId;
    const {testId} = req.query;
    try {
        const userTest = await UserTest.findOne({ user: userId, test: testId});
        const test = await Test.findById(testId);
        if(!userTest || !test){
            return res.status(404).json({message: "Test not found"});
        }
        if(!userTest.paid){
            userTest.test = "";
            return res.status(404).json(userTest);
        }
        const questions = await Question.find({questionNo: {$in: test.questions}},
             '-answer -createdAt -updatedAt -__v');  
        const data = {
            test,
            questions,
            bookedTime: userTest.bookedTime,
        }
        userTest.attempted = true;
        await userTest.save();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({message: "Server error"});
    }
}

const submitTest = async(req:ICustomRequest, res:Response)=>{
    try {
        const userId = req.userId;
        const {answers} = req.body;
        const {testId} = req.query;        
        const userTest = await UserTest.findOne({ user: userId, test: testId});
        if(!userTest){
            return res.status(404).json({message: "Test not found"});
        }
        if(!userTest.paid){
            return res.status(400).json({message: "Test not paid"});
        }
        const bookedTime = userTest.bookedTime.getTime();
        const upperTime = bookedTime + (userTest.duration * 1000 * 60) + (2000 * 60); //2 min extra time
        if(upperTime < Date.now()){
            return res.status(400).json({message: "Submit failed due to late submission"});
        }
        userTest.answers = answers??{};
        userTest.attempted = true;
        const [correctMarks, totalMarks] = await markCalculations(answers, testId as string);
        userTest.marksAchieved = correctMarks??0;
        userTest.totalMarks = totalMarks;
        await userTest.save();
        return res.status(200).json({message: "Test submitted successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Server error"});
    }
}

const upcomingTest = async(req:ICustomRequest, res:Response)=>{
    try{
        const userId = req.userId;       
        // const attemptedTest = await UserTest.findOne({ user: userId, attempted: true}).sort({createdAt:-1}); 
        const userTest = await UserTest.findOne({ user: userId }, 
            '-answers -createdAt -updatedAt -__v')
            .sort({createdAt:-1});
        if(!userTest){
            return res.status(200).json({registered: false, attemptedTest: false, data: null});
        }
        if(userTest.attempted){
            return res.status(200).json({registered: true, attemptedTest: true, data: userTest});
        }
        const bookedTime = userTest.bookedTime.getTime();
        const upperTime = bookedTime + (userTest.duration * 1000 * 60)
        if(upperTime < Date.now()){
            return res.status(200).json({registered: false, attemptedTest: false});
        }
        return res.status(200).json({
            registered: true, 
            attemptedTest: false,
            data: userTest,
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({message: "Server error", registered: true, data: null, attemptedTest: false});
    }
}

const registerTest = async(req:ICustomRequest, res:Response)=>{
    try {
        const userId = req.userId;
        const {dateTime} = req.body;
        const test = await Test.findOne().sort({createdAt:-1});
        if(!test){
            return res.status(404).json({message: "No test found"});
        }
        const mergedDate = new Date(dateTime);
        if(mergedDate.getTime() < Date.now()){
            return res.status(400).json({message: "Invalid booking date, Please choose a future date"});
        }
        const userTestExists = await UserTest.findOne({user: userId, test: test._id});
        if(userTestExists){
            return res.status(400).json({message: "You have already registered for this test"});
        }
        await UserTest.create({user: userId, test: test._id, bookedTime: mergedDate, paid: true, duration: test.duration});
        return res.status(200).json({message: "Test registered successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Server error"});
    }
}

const setQuestions = async(req:ICustomRequest, res:Response)=>{
    try {
        const userId = req.userId;
        const data = req.body;
        const isExists = await Question.findOne({$or:[{questionNo: data.questionNo},{title: data.title}]});
        if(isExists){
            if(isExists.questionNo === data.questionNo){
                return res.status(400).json({message: "Question no already exists"});
            }
            return res.status(400).json({message: "Question title exists"});
        }
        const questions = await Question.create(data);
        return res.status(200).json({message: "Answer submitted successfully"});
    } catch (error) {
        return res.status(500).json({message: "Server error"});
    }
}

const setTest = async(req:ICustomRequest, res:Response)=>{
    const userId = req.userId;
    try {
        const data = req.body;
        if(!data.title || !data.questions || !data.description || !data.duration){
            return res.status(400).json({message: "All fields are required"});
        }
        const response = await Test.create(data);
        return res.status(200).json({message: "Test set successfully"});
    } catch (error) {
        return res.status(500).json({message: "Server error"});
    }
}

const scoreCard = async(req:ICustomRequest, res:Response)=>{
    const userId = req.userId;
    const {testId} = req.query;
    try {
        const userTest = await UserTest.findOne({user: userId, test: testId},
            "-createdAt -updatedAt -__v -paid -bookedTime -duration -attempted"
        );
        const test = await Test.findById(testId);
        if(!userTest || !test){
            return res.status(404).json({message: "No test found"});
        }
        const questions = await Question.find({questionNo: {$in: test.questions}},
            "-createdAt -updatedAt -__v"
        );
        if(!questions){
            return res.status(404).json({message: "No questions found"});
        }
        return res.status(200).json({data: userTest, questions});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Server error"});
    }
}

export {getTest, submitTest, upcomingTest, registerTest, setQuestions, setTest, scoreCard}