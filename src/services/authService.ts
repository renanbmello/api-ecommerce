import { Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { User, UserRegistrationData, UserLoginData } from '../types/user';

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET || 'secret';

export const registerUser: RequestHandler = async (req: Request<{}, {}, UserRegistrationData>, res, next) => {
    const { email, password, name } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name }
        });

        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(400).json({ error: 'Registration failed', details: errorMessage });
    }
};

export const loginUser: RequestHandler = async (req: Request<{}, {}, UserLoginData>, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ message: 'Invalid credentials' });
            return; 
        }

        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

        res.json({ token });
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(400).json({ error: 'Login failed', details: errorMessage });
    }
};
