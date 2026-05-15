const mongoose = require("mongoose")

const TodoSchema = new mongoose.Schema({

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  title:{
    type:String,
    required:true
  },

  description:{
    type:String,
    default:""
  },

  date:{
    type:String, // "YYYY-MM-DD"
    required:true
  },

  timeFrom:{
    type:String, // "HH:MM"
    default:""
  },

  timeTo:{
    type:String, // "HH:MM"
    default:""
  },

  completed:{
    type:Boolean,
    default:false
  },

  priority:{
    type:String,
    enum:["low","medium","high"],
    default:"medium"
  },

  tags:{
    type:[String],
    default:[]
  }

},{timestamps:true})

module.exports = mongoose.model("Todo",TodoSchema)
