import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true}, statId:{type:mongoose.Schema.Types.ObjectId,ref:'Stat',required:true,index:true}, taskId:{type:mongoose.Schema.Types.ObjectId,ref:'Task',required:true}, date:{type:String,required:true}, status:{type:String,enum:['pending','success','fail','rest'],default:'pending'}, xpEarned:{type:Number,default:0}, completedAt:{type:Date} },{timestamps:true});
schema.index({userId:1,date:1,statId:1},{unique:true});
export const DailyAssignment = mongoose.model('DailyAssignment',schema);
