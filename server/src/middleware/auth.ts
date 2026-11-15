import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

declare global { namespace Express { interface Request { userId?: string } } }
export function auth(req:Request,res:Response,next:NextFunction){ const h=req.header('authorization'); if(!h?.startsWith('Bearer ')) return res.status(401).json({error:'Unauthorized'}); try { const p=jwt.verify(h.slice(7),process.env.JWT_SECRET!) as {sub:string}; if(!mongoose.isValidObjectId(p.sub)) throw new Error(); req.userId=p.sub; next(); } catch { return res.status(401).json({error:'Invalid or expired token'}); } }
