import mongoose from "mongoose";

interface ITypes {
    value: string;
    summary: string;
}

const aptiQuestionCategoriesSchema = new mongoose.Schema<ITypes>(
    {
        value: { type: String, required: true, index: true, unique: true }, //ref to question model
        summary: { type: String, required: true },
    },
    { timestamps: true }
);
const AptiQuestionCategories = mongoose.model<ITypes>(
    "aptiQuestionCategories",
    aptiQuestionCategoriesSchema
);

const aptiQuestionTopicsSchema = new mongoose.Schema<ITypes>(
    {
        value: { type: String, required: true, index: true, unique: true }, //ref to question model
        summary: { type: String, required: true },
    },
    { timestamps: true }
);
const AptiQuestionTopics = mongoose.model<ITypes>(
    "aptiQuestionTopics",
    aptiQuestionTopicsSchema
);

const aptiQuestionCompaniesSchema = new mongoose.Schema<ITypes>(
    {
        value: { type: String, required: true, index: true, unique: true }, //ref to question model
        summary: { type: String, required: true },
    },
    { timestamps: true }
);
const AptiQuestionCompanies = mongoose.model<ITypes>(
    "aptiQuestionCompanies",
    aptiQuestionCompaniesSchema
);

export { AptiQuestionCategories, AptiQuestionTopics, AptiQuestionCompanies };
