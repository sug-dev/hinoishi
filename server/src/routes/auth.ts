import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import {User} from '../models/User.js';
import {Stat} from '../models/Stat.js';

const r=Router();
const schema=z.object({email:z.email(),password:z.string().min(8).max(200)});
const defaults=[['Health','❤️'],['Intelligence','🧠'],['Physical','💪'],['Creativity','🎨'],['Exploration','🧭'],['Environment','🧹'],['Connection','🤝'],['Mind','🧘'],['Fun','🎮']];
function token(id:string){return jwt.sign({sub:id},process.env.JWT_SECRET!,{expiresIn:'7d'});}
r.post('/register',async(req,res)=>{try{const {email,password}=schema.parse(req.body); if(await User.exists({email})) return res.status(409).json({error:'Account already exists'}); const user=await User.create({email,passwordHash:await bcrypt.hash(password,12)}); await Stat.insertMany(defaults.map(([name,icon])=>({userId:user._id,name,icon}))); return res.status(201).json({token:token(user.id)});}catch(e){return res.status(400).json({error:e instanceof Error?e.message:'Invalid request'});}});
r.post('/login',async(req,res)=>{try{const {email,password}=schema.parse(req.body); const user=await User.findOne({email}); if(!user || !(await bcrypt.compare(password,user.passwordHash))) return res.status(401).json({error:'Invalid email or password'}); return res.json({token:token(user.id)});}catch(e){return res.status(400).json({error:'Invalid request'});}});
export default r;
