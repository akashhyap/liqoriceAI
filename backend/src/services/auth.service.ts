import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class AuthService {
    async register(email: string, password: string, name: string) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }

    private generateToken(user: any): string {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );
    }

    async validateToken(token: string) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                userId: string;
            };
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            return user;
        } catch (error) {
            return null;
        }
    }
}

export const authService = new AuthService();
