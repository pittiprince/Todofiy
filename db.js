const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId =Schema.ObjectId

// creating Data Base schema for Todo Application
const user = new Schema({
    email:{type:String , unique:true},
    password:String,
    name:String
})

const Todos = new Schema({
        userId:ObjectId,
        desc:String,
        done:Boolean
})

//db model
const userModel = mongoose.model('user',user)
const TodoModel = mongoose.model('todos',Todos)


//export
module.exports = {
    userModel,
    TodoModel
}