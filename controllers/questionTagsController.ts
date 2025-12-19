import { AptiQuestionCategories, AptiQuestionCompanies, AptiQuestionTopics } from "../models/questionTags";
import slugify from "slugify";
import ICustomRequest from "../utils/customRequest";
import { Response } from "express";
import client from "../utils/redis";
import { REDIS_EXPIRY } from "../consts";
import questions from "../models/questions";

const addCategory = async (req: ICustomRequest, res: Response) => {
    try {
        let { value, summary, slug } = req.body;
        if (!slug) slug = slugify(value, { lower: true, strict: true });
        const category = await AptiQuestionCategories.findOne({ value });
        if (category) return res.status(400).json({ message: "Topic already exists" });
        const response = await AptiQuestionCategories.create({ value, summary, slug });
        return res.status(200).json({ message: "Category added successfully", data: response });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const addTopic = async (req: ICustomRequest, res: Response) => {
    try {
        let { value, summary, slug } = req.body;
        if (!slug) slug = slugify(value, { lower: true, strict: true });
        const topic = await AptiQuestionTopics.findOne({ value });
        if (topic) return res.status(400).json({ message: "Topic already exists" });
        const response = await AptiQuestionTopics.create({ value, summary, slug });
        return res.status(200).json({ message: "Topic added successfully", data: response });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error", error });
    }
};

const addCompany = async (req: ICustomRequest, res: Response) => {
    try {
        let { value, summary, slug } = req.body;
        if (!slug) slug = slugify(value, { lower: true, strict: true });
        const company = await AptiQuestionCompanies.findOne({ value });
        if (company) return res.status(400).json({ message: "Topic already exists" });
        const response = await AptiQuestionCompanies.create({ value, summary, slug });
        return res.status(200).json({ message: "Company added successfully", data: response });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const addQuestionTag = async (req: ICustomRequest, res: Response) => {
    try {
        const data = req.body;
        data.value = data.value.trim();
        if (data.type === "category") return addCategory(req, res);
        if (data.type === "topic") return addTopic(req, res);
        if (data.type === "company") return addCompany(req, res);
        return res.status(400).json({ message: "Invalid tag type" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const getQuestionTags = async (req: ICustomRequest, res: Response) => {
    const key = req.originalUrl;
    const { search = "" } = req.query;
    console.log(key, search)
    try {
        const [categories, topics, companies] = await Promise.all([
            AptiQuestionCategories.find({ value: { $regex: search, $options: "i" } }).select("-createdAt -updatedAt -__v").limit(6),
            AptiQuestionTopics.find({ value: { $regex: search, $options: "i" } }).select("-createdAt -updatedAt -__v").limit(6),
            AptiQuestionCompanies.find({ value: { $regex: search, $options: "i" } }).select("-createdAt -updatedAt -__v").limit(6)
        ]);
        console.log(categories, topics, companies)
        await client.set(key, JSON.stringify({ categories, topics, companies }), { EX: REDIS_EXPIRY });
        return res.status(200).json({ categories, topics, companies });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const getQuestionTagBasedOnTopic = async (req: ICustomRequest, res: Response) => {
    try {
        const key = req.originalUrl;
        const { search = "" } = req.query;
        const questions = await AptiQuestionTopics.find({ value: { $regex: search, $options: "i" } }).select("-createdAt -updatedAt -__v");
        await client.set(key, JSON.stringify({ questions }), { EX: REDIS_EXPIRY });
        return res.status(200).json({ questions, search });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const getQuestionTagBasedOnCompany = async (req: ICustomRequest, res: Response) => {
    try {
        const key = req.originalUrl;
        const { search = "" } = req.query;
        const questions = await AptiQuestionCompanies.find({ value: { $regex: search, $options: "i" } }).select("-createdAt -updatedAt -__v");
        await client.set(key, JSON.stringify({ questions }), { EX: REDIS_EXPIRY });
        return res.status(200).json({ questions, search });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

const getQuestionTagBasedOnCategory = async (req: ICustomRequest, res: Response) => {
    try {
        const key = req.originalUrl;
        const { search = "" } = req.query;
        const questions = await AptiQuestionCategories.find({ value: { $regex: search, $options: "i" } }).select("-createdAt -updatedAt -__v");
        await client.set(key, JSON.stringify({ questions }), { EX: REDIS_EXPIRY });
        return res.status(200).json({ questions, search });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

export { addQuestionTag, getQuestionTags, getQuestionTagBasedOnTopic, getQuestionTagBasedOnCompany, getQuestionTagBasedOnCategory };