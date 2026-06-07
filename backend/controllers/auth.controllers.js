import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import genToken from "../utils/token.js"
import { sendOtpMail, sendWelcomeMail } from "../utils/mail.js"

export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body

        if (!fullName || fullName.trim() === "") {
            return res.status(400).json({ message: "Full Name is required." })
        }

        // Strict Name Validation (Only letters and spaces)
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(fullName)) {
            return res.status(400).json({ message: "Full Name can only contain letters and spaces." })
        }

        if (!password || password.trim() === "") {
            return res.status(400).json({ message: "Password is required." })
        }

        // Strict Email Format Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format. Please provide a valid email." })
        }

        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: "User Already exist." })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "password must be at least 6 characters." })
        }
        if (mobile.length < 10) {
            return res.status(400).json({ message: "mobile no must be at least 10 digits." })
        }

        let userByMobile = await User.findOne({ mobile })
        let isNewRegistration = true;

        if (userByMobile) {
            // Check if it's an incomplete user created by mobile OTP (no password)
            if (userByMobile.password) {
                return res.status(400).json({ message: "User with this mobile already exists." })
            } else {
                // Upgrade the existing OTP dummy user to a full user
                const hashedPassword = await bcrypt.hash(password, 10)
                userByMobile.fullName = fullName;
                userByMobile.email = email;
                userByMobile.password = hashedPassword;
                userByMobile.role = role || "user";
                await userByMobile.save();
                user = userByMobile;
            }
        } else {
            // Normal creation if they didn't go through the DigiEats OTP flow somehow
            const hashedPassword = await bcrypt.hash(password, 10)
            user = await User.create({
                fullName,
                email,
                role,
                mobile,
                password: hashedPassword
            })
        }

        // Send Welcome Mail!
        if (isNewRegistration && user.email) {
            sendWelcomeMail(user.email, user.fullName || "Foodie");
        }

        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: false, // Localhost ke liye false sahi hai
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(201).json(user)

    } catch (error) {
        return res.status(500).json(`sign up error ${error}`)
    }
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User does not exist with this email." })
        }

        // Block sign in only if the user actually has no password (e.g. mobile OTP only user)
        if (!user.password) {
            return res.status(400).json({ message: "Please log in with Google or use your Mobile OTP." })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "incorrect Password." })
        }

        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({ message: `sign In error ${error.message}` })
    }
}

// --- 👇 YAHAN FIX KIYA HAI (Updated signOut) 👇 ---
export const signOut = async (req, res) => {
    try {
        // Cookie delete karne ke liye same options chahiye hote hain
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            secure: false // Ye match hona zaroori hai signIn/signUp se
        })
        return res.status(200).json({ message: "log out successfully" })
    } catch (error) {
        return res.status(500).json(`sign out error ${error}`)
    }
}
// --------------------------------------------------

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User does not exist." })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        user.resetOtp = otp
        user.otpExpires = Date.now() + 5 * 60 * 1000
        user.isOtpVerified = false
        await user.save()
        await sendOtpMail(email, otp)
        return res.status(200).json({ message: "otp sent successfully" })
    } catch (error) {
        return res.status(500).json(`send otp error ${error}`)
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await User.findOne({ email })
        if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "invalid/expired otp" })
        }
        user.isOtpVerified = true
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()
        return res.status(200).json({ message: "otp verify successfully" })
    } catch (error) {
        return res.status(500).json(`verify otp error ${error}`)
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body
        const user = await User.findOne({ email })
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "otp verification required" })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.isOtpVerified = false
        await user.save()
        return res.status(200).json({ message: "password reset successfully" })
    } catch (error) {
        return res.status(500).json(`reset password error ${error}`)
    }
}

export const googleAuth = async (req, res) => {
    try {
        const { fullName, email, mobile, role } = req.body
        let user = await User.findOne({ email })
        let isNewRegistration = false;
        if (!user) {
            isNewRegistration = true;
            user = await User.create({
                fullName, email, mobile, role
            })
        }

        // Send Welcome Mail!
        if (isNewRegistration && user.email) {
            sendWelcomeMail(user.email, user.fullName || "Foodie");
        }

        const token = await genToken(user._id)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(200).json(user)



    } catch (error) {
        return res.status(500).json(`googleAuth error ${error}`)
    }
}

// --- DigiEats STYLE MOBILE-FIRST OTP AUTH ---
export const sendMobileOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: "Valid 10-digit mobile number is required" });
        }

        let user = await User.findOne({ mobile });
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await User.create({
                mobile,
                role: "user",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;
        await user.save();

        console.log(`[SIMULATED SMS] OTP for ${mobile} is ${otp}`);

        return res.status(200).json({
            message: "OTP sent successfully",
            success: true,
            isNewUser,
            testOtp: otp
        });
    } catch (error) {
        return res.status(500).json({ message: `Send mobile OTP error: ${error}` });
    }
}

export const verifyMobileOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            return res.status(400).json({ message: "Mobile and OTP are required" });
        }

        const user = await User.findOne({ mobile });
        if (!user || user.resetOtp !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;

        // Before saving check if user is completing registration for the first time
        const wasJustCreated = !user.fullName && !user.email;

        await user.save();

        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `Verify mobile OTP error: ${error}` });
    }
}