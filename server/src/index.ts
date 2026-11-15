import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const app=express();
app.set('trust proxy', 1);
app.use(cors({origin:process.env.CLIENT_ORIGIN,credentials:false}));
app.use(express.json({limit:'32kb'}));
app.use(rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));
app.get('/health',(_,res)=>res.json({ok:true}));
app.use('/auth', authRoutes);
app.use('/', apiRoutes);
const port=Number(process.env.PORT||4000);
mongoose.connect(process.env.MONGODB_URI!).then(()=>app.listen(port,()=>console.log(`API on ${port}`))).catch(err=>{console.error(err);process.exit(1)});
