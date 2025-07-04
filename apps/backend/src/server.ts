import express from 'express';
import cors from 'cors';
import authRouter from "./routers/auth.router"
import studentRouter from "./routers/student.router"
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { getCurrentSemesterAndUpdate } from './services/student.service';
import redis from './config/redis';
import { getScoreTable, getStudentProfile, initializeSession, loginAndGetCookie, performFncRequest } from './services/crawler.senior.service';
import { parseScoresTable } from './services/parser.senior/scoretable.service';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter)

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`--- NEW Endpoint ---`);
});
