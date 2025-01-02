import express from 'express';
import connectMongoDb from './db';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoute';
import profileRouter from './routes/profileRoute';
import testRouter from './routes/testRoute';
import feedbackRouter from './routes/feedbackRoute';
import aptitudeRouter from './routes/aptitudeRoute';
import slowDown from 'express-slow-down';

const app = express();
const PORT = process.env.PORT
process.env.TZ = 'UTC';
app.set('trust proxy', 1); // Trust the first proxy

//Connecting to mongoDB
connectMongoDb()

//Middlewares
app.use(cors({
    origin: [process.env.CLIENT_DOMAIN_URL as string, process.env.CLIENT_DOMAIN_URL_2 as string, process.env.CLIENT_DOMAIN_URL_3 as string??""],
    methods: ["GET","POST","DELETE","PUT"],
    credentials: true,
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
app.get('/p/health',(req,res)=>{
    res.status(200).json({message: "Server is up and running"});
})

app.use('/p/api/v1/auth', authRouter);
app.use('/p/api/v1/user', profileRouter);
app.use('/p/api/v1/test', testRouter);
app.use('/p/api/v1/feedback', feedbackRouter);
app.use('/p/api/v1/aptitude', aptitudeRouter);
// app.use('/api/v1/payment', paymentRouter);

app.listen(PORT, ()=>{
    console.log(`Server started at port ${PORT}`);
})