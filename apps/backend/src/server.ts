import express, { response } from 'express';
import cors from 'cors';
import authRouter from "./routers/auth.router"
import cookieParser from 'cookie-parser';
// import { loginOldSeniorSystem, getExamScoreTable } from './services/crawler.senior.service';
import { Request, Response } from 'express';
import * as seniorSystem from './services/crawler.senior.service';
import { SeniorLoginData } from './types/crawler.senior.types';
import { parseProfile } from './services/parser.senior.service';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use("/abc/def", async (req: Request, res: Response) => {
    const id = process.env.ID || "?"
    const password = process.env.PASSWORD || "?"

    const credential: SeniorLoginData = { sid: id, password }
    const cookie = await seniorSystem.loginAndGetCookie(credential)
    console.log(cookie)

    seniorSystem.initializeSession(cookie)

    const profileContent = await seniorSystem.getStudentProfile(cookie)
    console.log(profileContent)

    console.log("Parsed content:", parseProfile(profileContent))
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`--- NEW Endpoint ---`);
});
