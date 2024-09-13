import express from 'express';
import connectMongoDb from './db';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoute';
import profileRouter from './routes/profileRoute';
import rateLimit from 'express-rate-limit';   //we can use slow down rate limitter as well

const app = express();
const PORT = 8000;

//Connecting to mongoDB
connectMongoDb()

//Middlewares
app.use(cors({
    origin: ['localhost:3000','http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ["GET","POST","DELETE","PUT"],
    credentials: true,
}))
app.use(rateLimit({
    windowMs: 1000 * 5, //5 sec
    max: 1,
}))

app.use(express.json())
app.use(cookieParser());

// Routes
app.get('/',(req,res)=>{
    res.status(200).send("Working");
})

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', profileRouter);

app.listen(PORT, ()=>{
    console.log(`Server started at port ${PORT}`);
})