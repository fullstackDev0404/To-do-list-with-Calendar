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
  },

  order:{
    type:Number,
    default:0
  },

  // Time tracking
  estimatedMinutes:{
    type:Number,
    default:0
  },
  loggedMinutes:{
    type:Number,
    default:0
  },

  // Habit / streak tracking
  streak:{
    type:Number,
    default:0
  },
  lastCompletedDate:{
    type:String, // "YYYY-MM-DD"
    default:""
  },

  // Reminder
  reminderAt:{
    type:String, // "HH:MM" on the task's date
    default:""
  }

},{timestamps:true})

module.exports = mongoose.model("Todo",TodoSchema)
