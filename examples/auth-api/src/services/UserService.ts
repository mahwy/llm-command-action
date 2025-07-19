import bcrypt from 'bcrypt'
import {
  User,
  CreateUserRequest,
  UserProfileUpdate,
  UserRole
} from '../models/User'
import { UserRepository } from '../repositories/UserRepository'

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    if (!userData.email || !userData.firstName || !userData.lastName) {
      throw new Error('Email, first name, and last name are required')
    }

    const existingUser = await this.userRepository.findByEmail(userData.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)

    return await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  async updateUserProfile(
    userId: string,
    updates: UserProfileUpdate
  ): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (updates.email) {
      const existingUser = await this.userRepository.findByEmail(updates.email)
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email is already in use by another user')
      }
    }

    return await this.userRepository.update(userId, {
      ...updates,
      updatedAt: new Date()
    })
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.findByRole(role)
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email)
  }

  sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user as any
    return sanitizedUser
  }
}
