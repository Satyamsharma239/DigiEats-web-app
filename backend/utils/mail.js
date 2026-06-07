import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Reset Your Password",
    html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
  })
}


export const sendDeliveryOtpMail = async (user, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
  })
}

export const sendWelcomeMail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Welcome to DigiEats!",
      html: `
            <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
                <h1 style="color: #e23744;">Welcome to DigiEats, ${name || "Foodie"}! 🎉</h1>
                <p style="font-size: 16px;">We're thrilled to have you on board. Get ready to explore the best food in your city!</p>
                <p style="font-size: 16px;">Order your favorite meals with just a few clicks.</p>
                <br/>
                <p style="font-size: 14px; color: #777;">Stay hungry, stay foolish.</p>
                <strong>The DigiEats Team</strong>
            </div>
            `
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export const sendAdminAlertMail = async (email, ip, time) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email, // Sending to the admin's email
      subject: "Security Alert: Admin Login Detected",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #e23744;">New Admin Login Detected</h2>
                <p>Hello Admin,</p>
                <p>A successful login to the DigiEats Admin Panel was just made using your credentials.</p>
                <ul>
                  <li><strong>Time:</strong> ${time}</li>
                  <li><strong>IP Address:</strong> ${ip}</li>
                </ul>
                <p>If this was you, you can safely ignore this email.</p>
                <p><strong>If you did not authorize this login, please change your password immediately.</strong></p>
                <br/>
                <p>Best regards,<br/>The DigiEats Security Team</p>
            </div>
            `
    });
  } catch (error) {
  }
}

export const sendOrderConfirmationMail = async (email, name, amount) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Order Confirmed - DigiEats",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #e23744;">Order Confirmed! 🍔</h2>
                <p>Hello ${name},</p>
                <p>Thank you for ordering with DigiEats! Your order has been placed successfully and is being prepared.</p>
                <p><strong>Total Amount:</strong> ₹${amount}</p>
                <br/>
                <p>You can track the status of your order in the 'My Orders' section of the DigiEats app.</p>
                <br/>
                <p>Enjoy your meal!<br/>The DigiEats Team</p>
            </div>
            `
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}
