import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true}, statId:{type:mongoose.Schema.Types.ObjectId,ref:'Stat',required:true,index:true}, name:{type:String,required:true,trim:true}, description:{type:String,default:''}, xp:{type:Number,default:10,min:0}, minLevel:{type:Number,default:1,min:1}, active:{type:Boolean,default:true} },{timestamps:true});
export const Task = mongoose.model('Task',schema);
