import express from 'express'
import { registerUser,loginUser, getProfile,updateProfile,bookAppointment,listAppointment,cancelAppointment, forgotPassword, resetPassword, getAllUsers, deleteUser, requestDeleteAccount, deleteAppointment } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password', resetPassword)

userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-appointment',authUser,bookAppointment)
userRouter.get('/appointments',authUser,listAppointment)
userRouter.post('/cancel-appointment',authUser,cancelAppointment)
userRouter.get('/users', getAllUsers)
userRouter.delete('/users/:userId', deleteUser)
userRouter.post('/request-delete-account', authUser, requestDeleteAccount)
userRouter.delete('/appointments/:appointmentId', deleteAppointment)

export default userRouter