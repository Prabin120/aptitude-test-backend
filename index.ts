import express from 'express';
import connectMongoDb from './db';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoute';
import profileRouter from './routes/profileRoute';
import testRouter from './routes/testRoute';
import feedbackRouter from './routes/feedbackRoute';
import rateLimit from 'express-rate-limit';   //we can use slow down rate limitter as well
import slowDown from 'express-slow-down';
// import paymentRouter from './routes/paymentRoute';

const app = express();
const PORT = process.env.PORT

app.set('trust proxy', 1); // Trust the first proxy

//Connecting to mongoDB
connectMongoDb()

//Middlewares
app.use(cors({
    origin: [process.env.CLIENT_DOMAIN_URL as string, "http://localhost:3000"],
    methods: ["GET","POST","DELETE","PUT"],
    credentials: true,
}))
app.use(rateLimit({
    windowMs: 1000 * 1, //5 sec
    max: 3,
}))

const limiter = slowDown({
    windowMs: 1 * 60 * 1000, // 15 minutes
    delayAfter: 1, // allow 10 requests without slowing them down
    delayMs: (hits) => hits * 200, // add 200ms delay to every request after the 10th
    maxDelayMs: 1000, // max global delay of 5 seconds
});

app.use(limiter)
app.use(express.json())
app.use(cookieParser());

// Routes
app.get('/',(req,res)=>{
    res.status(200).send("Working");
})

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', profileRouter);
app.use('/api/v1/aptitude', testRouter);
app.use('/api/v1/feedback', feedbackRouter);
// app.use('/api/v1/payment', paymentRouter);

app.listen(PORT, ()=>{
    console.log(`Server started at port ${PORT}`);
})