import { Router } from 'express';
import {userController} from '../controllers/user.controller';
import {teamController} from '../controllers/team.controller';
import {leaveController} from '../controllers/leave.controller';
import {leaveApprovalController} from '../controllers/leave-approval.controller';
import {authController} from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';
import {downloadController} from '../controllers/download.controller';

export const ApiRouter = Router();
ApiRouter.use('/auth', authController);
ApiRouter.use('/download', downloadController);
ApiRouter.use('/users', authMiddleware, userController);
ApiRouter.use('/teams', authMiddleware, teamController);
ApiRouter.use('/leaves', authMiddleware, leaveController);
ApiRouter.use('/leave-approval', authMiddleware, adminMiddleware, leaveApprovalController);
