import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import { sendVerificationEmail } from '../utils/emailConfig.js'

//API to register user
const registerUser = async(req , res)=>{
    try {
        const {name,email,password} = req.body
        if (!name || !password || !email) {
            return res.json({success:false,message:"Missing Details"})
        }

        //validating email format
        if (!validator.isEmail(email)) {
            return res.json({success:false,message:"Enter a valid Email"})
        }

        //validationg strong password
        if (password.length<8) {
            return res.json({success:false,message:"Enter a strong password"})
        }

        //hashing user password
        const salt =await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const userData = {
            name,
            email,
            password:hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        
        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)

        res.json({success:true,token})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API for user login
const loginUser = async(req,res)=>{
    try {
        const {email,password} = req.body
        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({success:false,message:'User does not exist'})
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if (isMatch) {
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
            res.json({success:true,token})
        }else{
            res.json({success:false,message:"Invalid Credentials"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to get user profile data
const getProfile = async (req,res)=>{
    try {
        const {userId} = req.body
        const userData = await userModel.findById(userId).select('-password')
        res.json({success:true,userData})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to update user profile
const updateProfile = async(req,res)=>{
    try {
        const {userId, name,phone,address,dob,gender} = req.body
        const imageFile = req.file 

        if (!name || !phone || !dob || !gender) {
            return res.json({success:false, message:'data Missing'})
        }
        await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address), dob,gender})
        if (imageFile) {
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{image:imageURL})
        }
        res.json({success:true,message:"Profile Updated"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to book appointment
const bookAppointment = async (req,res) => {
    try {
        const {userId,docId,slotDate,slotTime} = req.body
        const docData = await doctorModel.findById(docId).select('-password')
        if (!docData.available)  {
            return res.json({success:false,message:'Doctor not Available'})
        }
        let slots_booked = docData.slots_booked

        //checking for slot availability
        if(slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({success:false,message:'Slot not Available'})
            }else{
                slots_booked[slotDate].push(slotTime)
            }
        }else{
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')
        delete docData.slots_booked
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        //save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})
        res.json({success:true,message:'Appointment Booked'})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to get user appointment
const listAppointment = async (req,res)=>{
    try {
        const {userId} = req.body
        const appointments =await appointmentModel.find({userId})
        res.json({success:true,appointments})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to cansel appointment
const cancelAppointment = async(req,res)=>{
    try {
        const {userId,appointmentId}= req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        //verify appointment user
        if (appointmentData.userId!== userId) {
            return res.json({success:false,message:'Unauthorized action'})
        }

        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        //relesing doctor slot
        const {docId,slotDate,slotTime}=appointmentData
        const doctorData = await doctorModel.findById(docId)
        let slots_booked = doctorData.slots_booked
        slots_booked[slotDate]=slots_booked[slotDate].filter(e=> e!==slotTime)
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})
        res.json({success:true,message:'Appointment Cancelled'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


//API for forgot password
const forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // Check if email configuration is set up
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('Email configuration missing:', {
                hasEmailUser: !!process.env.EMAIL_USER,
                hasEmailPassword: !!process.env.EMAIL_PASSWORD,
                emailUser: process.env.EMAIL_USER
            });
            return res.json({ 
                success: false, 
                message: "Email service is not configured. Please contact support."
            });
        }

        console.log('Looking up user with email:', email);
        const user = await userModel.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.json({ success: false, message: "User not found" });
        }

        console.log('User found, generating verification code');
        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store the verification code in the user document
        user.resetPasswordCode = verificationCode;
        user.resetPasswordExpires = Date.now() + 3600000; // Code expires in 1 hour
        await user.save();
        console.log('Verification code saved to user document');

        // Send verification code via email
        console.log('Attempting to send verification email');
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (!emailSent) {
            console.log('Email sending failed, cleaning up verification code');
            // If email fails, remove the verification code
            user.resetPasswordCode = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            
            return res.json({ 
                success: false, 
                message: "Failed to send verification code. Please try again later."
            });
        }

        console.log('Password reset process completed successfully');
        res.json({ 
            success: true, 
            message: "Verification code has been sent to your email"
        });

    } catch (error) {
        console.error('Forgot password error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.json({ 
            success: false, 
            message: "An error occurred while processing your request. Please try again later."
        });
    }
};

//API for reset password
const resetPassword = async(req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.json({ success: false, message: "All fields are required" });
        }

        const user = await userModel.findOne({ 
            email,
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: "Invalid or expired verification code" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: "Password has been reset successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//API for verify reset code
const verifyResetCode = async(req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.json({ success: false, message: "Email and code are required" });
        }

        const user = await userModel.findOne({ 
            email,
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: "Invalid or expired verification code" });
        }

        res.json({ success: true, message: "Verification code is valid" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//API to get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select('-password -resetPasswordCode -resetPasswordExpires');
        res.json({ success: true, data: users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//API to delete user
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await userModel.findByIdAndDelete(userId);
        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//API to request account deletion
const requestDeleteAccount = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Update user's deleteRequested status
        await userModel.findByIdAndUpdate(userId, { deleteRequested: true });
        
        res.json({ success: true, message: "Delete account request sent successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//API to delete appointment (admin only)
const deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (!appointment.cancelled) {
            return res.json({ success: false, message: "Only cancelled appointments can be deleted" });
        }

        // Release the doctor's slot
        const { docId, slotDate, slotTime } = appointment;
        const doctorData = await doctorModel.findById(docId);
        if (doctorData && doctorData.slots_booked && doctorData.slots_booked[slotDate]) {
            doctorData.slots_booked[slotDate] = doctorData.slots_booked[slotDate].filter(e => e !== slotTime);
            await doctorModel.findByIdAndUpdate(docId, { slots_booked: doctorData.slots_booked });
        }

        // Delete the appointment
        await appointmentModel.findByIdAndDelete(appointmentId);
        res.json({ success: true, message: "Appointment deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    forgotPassword,
    resetPassword,
    verifyResetCode,
    getAllUsers,
    deleteUser,
    requestDeleteAccount,
    deleteAppointment
}