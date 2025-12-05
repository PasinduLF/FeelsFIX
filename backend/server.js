import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import addminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import contactRouter from './routes/contact.js'
import paymentRoutes from './routes/router.js'
import workshopRoutes from './routes/workshopRoute.js'
import { handleWorkshopPaymentWebhook } from './controllers/workshopController.js'

//app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//webhook endpoint needs the raw body before we enable JSON parsing
app.post('/api/workshops/payment/webhook', express.raw({ type: 'application/json' }), handleWorkshopPaymentWebhook)

//middlewares
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data
app.use('/uploadPayment', express.static('uploadPayment'));


//api endpoints
app.use('/api/admin',addminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)
app.use("/contact", contactRouter);
app.use('/api', paymentRoutes);
app.use('/api/workshops', workshopRoutes);


// Error handler for malformed JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: "Invalid JSON format. Use double quotes for properties." });
    }
    next();
  });

app.get('/',(req,res)=>{
    res.send('API Working')
})
app.listen(port, ()=>console.log("Server Started", port))