import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';

export const userRouter = Router();

// Profile routes (requires authentication, currently via header)
userRouter.get('/profile', userController.getUserProfile);
userRouter.put('/profile', userController.updateUserProfile);

// Public user route
userRouter.get('/:id', userController.getUserById);

// We will add auth routes (/register, /login) here later