import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest, UserProfileUpdate } from '../models/User';

export class UserController {
  constructor(private userService: UserService) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      const user = await this.userService.createUser(userData);
      const sanitizedUser = this.userService.sanitizeUser(user);
      res.status(201).json(sanitizedUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const updates: UserProfileUpdate = req.body;
      const user = await this.userService.updateUserProfile(userId, updates);
      const sanitizedUser = this.userService.sanitizeUser(user);
      res.json(sanitizedUser);
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.userService.findByEmail(''); // This should use findById
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const sanitizedUser = this.userService.sanitizeUser(user);
      res.json(sanitizedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}