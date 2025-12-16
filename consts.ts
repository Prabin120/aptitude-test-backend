export const gettingQuestionsForTest = '/s/test/questions';
export const goServer = "http://go-server:8080";
export const REDIS_EXPIRY = parseInt(process.env.REDIS_EXPIY_TIME ?? "3600");
export const getCachingKey: { [key: string]: string } = {
    getTests: "/p/api/v1/test?undefined, /p/api/v1/test, /p/api/v1/test?",
    getQuestionTags: "/p/api/v1/aptitude/question-tag?undefined, /p/api/v1/aptitude/question-tag"
}
