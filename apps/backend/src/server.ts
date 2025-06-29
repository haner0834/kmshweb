import express from 'express';
import cors from 'cors';
import authRouter from "./routers/auth.router"
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`--- NEW Endpoint ---`);
    console.log(`POST /api/auth/force-logout (body: { deviceId }, requires auth)`);
});
