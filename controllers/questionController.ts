import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import Question from "../models/questions";

const getQuestion = async (req: ICustomRequest, res: Response) => {
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
		const page = Number(req.query?.page) || 1;
		const limit = Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit; // Calculate skip value
		const questions = await Question.find({})
			.select("questionNo title type marks slug")
			.skip(skip) // Use skip for pagination
			.limit(limit > 30 ? 30 : limit); // Limit the number of results

		const totalQuestions = await Question.countDocuments(); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit); // Calculate total pages

		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

const getQuestionById = async (req: ICustomRequest, res: Response) => {
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
		return res.status(200).json(question);
	} catch (error) {
		return res.status(500).json({ message: error });
	}
};

const getQuestionByCategoty = async (req: ICustomRequest, res: Response) => {
	try {
		const page = Number(req.query?.page) || 1;
		const limit = Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit; // Calculate skip value

		const { category } = req.params;
		const categoryString = category.split("%20").join(" ");
		const questions = await Question.find({ categories: categoryString },
			"questionNo slug title type marks answers options"
			)
			.skip(skip)
			.limit(limit > 30 ? 30 : limit);

		const totalQuestions = await Question.countDocuments({
			categories: categoryString,
		}); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit);
		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions by category:", error);
		throw error; // Handle the error as needed
	}
};

const getQuestionByTopic = async (req: ICustomRequest, res: Response) => {
	try {
		const { topic } = req.params;
		const topicString = topic.split("%20").join(" ");
		const page = Number(req.query?.page) || 1;
		const limit = Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit; // Calculate skip value
		// const skip = (page - 1) * limit;
		const questions = await Question.find({ topics: topicString },
			"questionNo slug title type marks answers options"
			)
			.skip(skip)
			.limit(limit > 30 ? 30 : limit);
		const totalQuestions = await Question.countDocuments({
			topics: topicString,
		}); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit);
		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
		return res.status(200).json({ data: questions, totalPages });
	} catch (error) {
		console.error("Error fetching paginated questions by category:", error);
		throw error; // Handle the error as needed
	}
};

const getQuestionByCompany = async (req: ICustomRequest, res: Response) => {
	const { company } = req.params;
	const companyString = company.split("%20").join(" ");
	try {
		const page = Number(req.query?.page) || 1;
		const limit =
			(Number(req.query?.limit) || 10) > 10
				? 10
				: Number(req.query?.limit) || 10;
		const skip = (page - 1) * limit;
		const questions = await Question.find({ companies: companyString },
			"questionNo slug title type marks answers options"
			)
			.skip(skip)
			.limit(limit > 30 ? 30 : limit);
		const totalQuestions = await Question.countDocuments({
			companies: companyString,
		}); // Get total questions count
		const totalPages = Math.ceil(totalQuestions / limit);
		if (!questions.length) {
			return res
				.status(404)
				.json({ data: [], totalPages, message: "No questions found" });
		}
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
	const slug = req.params;
	const questionBody = req.body;
	try {
		if (
			!questionBody.title ||
			!questionBody.questionNo ||
			!questionBody.type ||
			!questionBody.options ||
			!questionBody.answer ||
			!questionBody.marks
		) {
			return res.status(400).json({ message: "All fields are required" });
		}
		const response = await Question.findOneAndUpdate(slug, questionBody);
		return res.status(200).json(response);
	} catch (error) {
		return res.status(500).json({ message: "Server error" });
	}
};

export {
	addQuestion,
	getQuestion,
	getAllQuestion,
	getQuestionById,
	modifyQuestion,
	getQuestionByCategoty,
	getQuestionByTopic,
	getQuestionByCompany,
};
