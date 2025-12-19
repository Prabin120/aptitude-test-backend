import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import Question from "../models/questions";
import { REDIS_EXPIRY } from "../consts";
import client from "../utils/redis";
import slugify from "slugify";

const getQuestion = async (req: ICustomRequest, res: Response) => {
	const key = req.originalUrl;
	const { slug } = req.params;
	if (!slug) {
		return res.status(400).json({ message: "Slug is required" });
	}
	try {
		const question = await Question.findOne({ slug }).select(
			"-answer -__v -createdAt -updatedAt"
		);
		if (!question) {
			return res.status(404).json({ message: "Question not found" });
		}
		const nextQuestion = await Question.findOne({
			questionNo: question.questionNo + 1,
		}).select("slug");
		const prevQuestion = await Question.findOne({
			questionNo: question.questionNo - 1,
		}).select("slug");
		const nextQuestionSlug = nextQuestion ? nextQuestion.slug : null;
		const prevQuestionSlug = prevQuestion ? prevQuestion.slug : null;
		await client.set(key, JSON.stringify({ question, nextQuestionSlug, prevQuestionSlug }), { EX: REDIS_EXPIRY });
		return res
			.status(200)
			.json({ question, nextQuestionSlug, prevQuestionSlug });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Server error" });
	}
};

const getAllQuestion = async (req: ICustomRequest, res: Response) => {
	try {
		const key = req.originalUrl;
		const page = Number(req.query?.page) || 1;
		const search = req.query?.search;
		const skip = (page - 1) * 10; // Calculate skip value
		const filter = search ? { title: { $regex: search, $options: "i" } } : {};
		const questions = await Question.find(filter)
			.select("questionNo title type marks slug")
			.skip(skip) // Use skip for pagination
			.limit(10) // Limit the number of results
			.sort({ questionNo: 1 });

		const totalQuestions = await Question.countDocuments(filter); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / 10); // Calculate total pages

		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		await client.set(key, JSON.stringify({ data: questions, totalPages }), { EX: REDIS_EXPIRY });
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

const getQuestionById = async (req: ICustomRequest, res: Response) => {
	const key = req.originalUrl;
	const { id } = req.query;
	if (!id) {
		return res.status(400).json({ message: "Id is required" });
	}
	try {
		const question = await Question.findOne({ questionNo: id }).select(
			"-answer"
		);
		if (!question) {
			return res.status(404).json({ message: "Question not found" });
		}
		await client.set(key, JSON.stringify(question), { EX: REDIS_EXPIRY });
		return res.status(200).json(question);
	} catch (error) {
		return res.status(500).json({ message: error });
	}
};

const getQuestionByCategoty = async (req: ICustomRequest, res: Response) => {
	try {
		const key = req.originalUrl;
		const page = Number(req.query?.page) || 1;
		const limit = Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit; // Calculate skip value

		const { category } = req.params;
		const categorySlug = slugify(decodeURIComponent(category), { lower: true, strict: true });
		const questions = await Question.find({ categories: { $regex: new RegExp(`^${categorySlug}$`, "i") } },
			"questionNo slug title type marks answers options"
		)
			.skip(skip)
			.limit(limit > 30 ? 30 : limit);

		const totalQuestions = await Question.countDocuments({
			categories: { $regex: new RegExp(`^${categorySlug}$`, "i") },
		}); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit);
		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		await client.set(key, JSON.stringify({ data: questions, totalPages }), { EX: REDIS_EXPIRY });
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions by category:", error);
		throw error; // Handle the error as needed
	}
};

const getQuestionByTopic = async (req: ICustomRequest, res: Response) => {
	try {
		const key = req.originalUrl;
		const { topic } = req.params;
		const topicSlug = slugify(decodeURIComponent(topic), { lower: true, strict: true });
		const page = Number(req.query?.page) || 1;
		const limit = Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit; // Calculate skip value
		// const skip = (page - 1) * limit;
		const questions = await Question.find({ topics: { $regex: new RegExp(`^${topicSlug}$`, "i") } },
			"questionNo slug title type marks answers options"
		)
			.skip(skip)
			.limit(limit > 30 ? 30 : limit);
		const totalQuestions = await Question.countDocuments({
			topics: { $regex: new RegExp(`^${topicSlug}$`, "i") },
		}); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit);
		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		await client.set(key, JSON.stringify({ data: questions, totalPages }), { EX: REDIS_EXPIRY });
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions by category:", error);
		throw error; // Handle the error as needed
	}
};

const getQuestionByCompany = async (req: ICustomRequest, res: Response) => {
	const key = req.originalUrl;
	const { company } = req.params;
	const companySlug = slugify(decodeURIComponent(company), { lower: true, strict: true });
	try {
		const page = Number(req.query?.page) || 1;
		const limit = Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit;
		const questions = await Question.find({ companies: { $regex: new RegExp(`^${companySlug}$`, "i") } },
			"questionNo slug title type marks answers options"
		)
			.skip(skip)
			.limit(limit > 30 ? 30 : limit);
		const totalQuestions = await Question.countDocuments({
			companies: { $regex: new RegExp(`^${companySlug}$`, "i") },
		}); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit);
		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		await client.set(key, JSON.stringify({ data: questions, totalPages }), { EX: REDIS_EXPIRY });
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions by category:", error);
		throw error; // Handle the error as needed
	}
};

const addQuestion = async (req: ICustomRequest, res: Response) => {
	try {
		const questionBody = req.body;

		if (
			!questionBody.title ||
			!questionBody.description ||
			!questionBody.type ||
			!questionBody.options ||
			!questionBody.answers ||
			!questionBody.marks
		) {
			return res.status(400).json({ message: "All fields are required" });
		}
		const question = await Question.findOne({ title: questionBody.title });
		if (question) {
			return res.status(404).json({ message: "Question already exists" });
		}
		const response = await Question.create(questionBody);
		return res.status(201).json(response);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Server error" });
	}
};

const modifyQuestion = async (req: ICustomRequest, res: Response) => {
	const { slug } = req.params;
	const questionBody = req.body;

	// Safety: Remove immutable fields to prevent duplicate key errors
	delete questionBody.questionNo;
	delete questionBody._id;

	try {
		// Validate required fields based on Schema
		// Note: answers (plural) per user request/schema, though logic below checks both provided
		// if (
		// 	!questionBody.title ||
		// 	!questionBody.description ||
		// 	!questionBody.type ||
		// 	!questionBody.options ||
		// 	!questionBody.answers ||
		// 	!questionBody.marks
		// ) {
		// 	return res.status(400).json({ message: "All fields are required" });
		// }

		const existingQuestion = await Question.findOne({ slug });
		if (!existingQuestion) {
			return res.status(404).json({ message: "Question not found" });
		}

		// If title changes, regenerate slug
		if (questionBody.title !== existingQuestion.title) {
			let generatedSlug = slugify(questionBody.title, { lower: true, strict: true });
			if (generatedSlug.length > 30) {
				generatedSlug = generatedSlug.substring(0, 30);
			}
			// Ensure uniqueness (simple check, basic collision handling if needed like in model)
			const slugExists = await Question.findOne({ slug: generatedSlug });
			if (slugExists) {
				// Fallback or error? For now, append random string or fail. Model handles creation loop better.
				// Simple approach: append random
				generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
			}
			questionBody.slug = generatedSlug;
		}

		const response = await Question.findOneAndUpdate({ slug }, questionBody, { new: true });
		return res.status(200).json(response);
	} catch (error) {
		console.error("Modify question error:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

const searchLikeQuestions = async (req: ICustomRequest, res: Response) => {
	const query = req.params
	try {
		const questions = Question.find({ title: { $regex: '.*' + query + '.*' } },
			"questionNo slug title marks"
		).limit(5);
		return res.status(200).json(questions)
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
}

export {
	addQuestion,
	getQuestion,
	getAllQuestion,
	getQuestionById,
	modifyQuestion,
	getQuestionByCategoty,
	getQuestionByTopic,
	getQuestionByCompany,
	searchLikeQuestions
};
