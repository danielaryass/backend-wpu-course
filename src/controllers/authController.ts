import { Request, Response } from "express"
import * as Yup from "yup"
import UserModel from "../models/user.model"
import { encrypt } from "../utils/encryption"
import { generateToken, getUserData } from "../utils/jwt"
import { IReqUser } from "../middlewares/auth.middleware"
type TRegister = {
    fullName: string,
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
}

const registerValidateSchema = Yup.object({
    fullName: Yup.string().required(),
    username: Yup.string().required(),
    email: Yup.string().email().required(),
    password: Yup.string().required(),
    confirmPassword: Yup.string().required().oneOf([Yup.ref("password"), ""], "Password does not match"),

})

type TLogin = {
    identifier: string,
    password: string
}
export default {
    async register(req: Request, res: Response) {
        const { confirmPassword, email, fullName, password, username } = req.body as unknown as TRegister
        try {
            await registerValidateSchema.validate({
                fullName,
                username,
                email,
                password,
                confirmPassword
            })
            const result = await UserModel.create({
                fullName,
                username,
                email,
                password
            })
            res.status(200).json({
                message: "success",
                data: result
            })
        } catch (error) {
            const err = error as unknown as Error
            res.status(400).json({ message: err.message, data: null })

        }

    },
    async login(req: Request, res: Response) {
        const { identifier, password } = req.body as unknown as TLogin
        try {
            const findUser = await UserModel.findOne({ $or: [{ email: identifier }, { username: identifier }] })
            if (!findUser) {
                return res.status(403).json({ message: "User not found", data: null })
            }
            const validatePassword: boolean = encrypt(password) === findUser.password
            console.log(validatePassword)
            if (!validatePassword) {
                return res.status(403).json({ message: "Invalid password", data: null })
            }

            const token = generateToken({
                id: findUser._id,
                role: findUser.role
            })
            return res.status(200).json({
                message: "success",
                data: token
            })

        } catch (error) {
            const err = error as unknown as Error
            res.status(400).json({ message: err.message, data: null })

        }
    },
    async me(req: IReqUser, res: Response) {
        try {
            const user = req.user
            const findUser = await UserModel.findById(user?.id)
            if (!findUser) {
                return res.status(403).json({ message: "User not found", data: null })
            }
            return res.status(200).json({
                message: "success",
                data: findUser
            })
           
        } catch (error) {
            const err = error as unknown as Error
            res.status(400).json({ message: err.message, data: null })

        }
    }
}