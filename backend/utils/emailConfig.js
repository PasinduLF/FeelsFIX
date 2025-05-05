import nodemailer from 'nodemailer'

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
})

// Function to send verification email
export const sendVerificationEmail = async (email, code) => {
  console.log('Attempting to send email to:', email)
  console.log('Email configuration:', {
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD
  })

  const mailOptions = {
    from: `"FeelsFIX" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password. Please use the following verification code:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; margin: 0; font-size: 32px;">${code}</h1>
        </div>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `
  }

  try {
    console.log('Verifying SMTP connection...')
    // Verify SMTP connection configuration
    await transporter.verify()
    console.log('SMTP connection verified successfully')
    
    console.log('Sending email...')
    // Send the email
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    })
    return true
  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
      response: error.response,
      responseCode: error.responseCode
    })
    return false
  }
} 