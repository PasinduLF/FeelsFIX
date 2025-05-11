import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    image: {type:String, default:"https://res.cloudinary.com/dkfptto8m/image/upload/v1709799339/FeelsFIX/default-avatar_iyzqxj.png"},
    address: {type:Object, default:{line1:'',line2:''}},
    gender: {type:String,default:"Not Selected"},
    dob: {type:String,default:"Not Selected"},
    phone: {type:String,default:'0000000000'},
    resetPasswordCode: {type: String},
    resetPasswordExpires: {type: Date},
    deleteRequested: {type: Boolean, default: false}
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel