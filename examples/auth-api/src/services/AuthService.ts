import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { User } from '../models/User'
import { UserService } from './UserService'

export interface LoginResponse {
  token: string
  user: Omit<User, 'password'>
}

export class AuthService {
  constructor(private userService: UserService) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      (user as any).password
    )
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    return {
      token,
      user: this.userService.sanitizeUser(user)
    }
  }

  async refreshToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

      const user = await this.userService.findByEmail(decoded.email)
      if (!user) {
        throw new Error('User not found')
      }

      return jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      )
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }
}
