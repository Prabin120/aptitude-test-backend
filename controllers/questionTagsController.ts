import { AptiQuestionCategories, AptiQuestionCompanies, AptiQuestionTopics } from "../models/questionTags";
import ICustomRequest from "../utils/customRequest";
import { Response } from "express";

const addCategory = async (req: ICustomRequest, res: Response) => {
    try {
        const {value, summary} = req.body;
        const category = await AptiQuestionCategories.findOne({value});
        if(category) return res.status(400).json({ message: "Topic already exists" });
        const response = await AptiQuestionCategories.create({value, summary});
        return res.status(200).json({ message: "Category added successfully", data: response });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const addTopic = async (req: ICustomRequest, res: Response) => {
    try {
        const {value, summary} = req.body;
        const topic = await AptiQuestionTopics.findOne({value});
        if(topic) return res.status(400).json({ message: "Topic already exists" });
        const response = await AptiQuestionTopics.create({value, summary});
        return res.status(200).json({ message: "Topic added successfully", data: response });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error", error });
    }
};

const addCompany = async (req: ICustomRequest, res: Response) => {
    try {
        const {value, summary} = req.body;
        const company = await AptiQuestionCompanies.findOne({value});
        if(company) return res.status(400).json({ message: "Topic already exists" });
        const response = await AptiQuestionCompanies.create({value, summary});
        return res.status(200).json({ message: "Company added successfully", data: response });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const addQuestionTag = async (req: ICustomRequest, res: Response) => {
    try {
        const data = req.body;
        data.value = data.value.trim();
        if(data.type === "category") return addCategory(req, res);
        if(data.type === "topic") return addTopic(req, res);
        if(data.type === "company") return addCompany(req, res);
        return res.status(400).json({ message: "Invalid tag type" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const getQuestionTags = async (req: ICustomRequest, res: Response) => {
    try {
        const categories = await AptiQuestionCategories.find({}).select("-createdAt -updatedAt -__v");
        const topics = await AptiQuestionTopics.find({}).select("-createdAt -updatedAt -__v");
        const companies = await AptiQuestionCompanies.find({}).select("-createdAt -updatedAt -__v");
        return res.status(200).json({ categories, topics, companies });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

export { addQuestionTag, getQuestionTags };