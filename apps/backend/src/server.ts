import express from 'express';
import cors from 'cors';
import authRouter from "./routers/auth.router"
import studentRouter from "./routers/student.router"
import cookieParser from 'cookie-parser';
import { env } from './utils/env.utils';
import { responseExtender } from './middleware/response.middleware';
import { traceMiddleware } from './middleware/traceid.middleware';
import { UAParser } from 'ua-parser-js';

const app = express();
const PORT = env("PORT", "3000");

app.use(traceMiddleware)
app.use(responseExtender)
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter)
app.get("/piyan", async (req: express.Request, res: express.Response) => {
    const parser = new UAParser()
    parser.setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36");
    // parser.setUA("Unknown")
    const result = parser.getResult()
    res.json(result)
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`--- NEW Endpoint ---`);
});
