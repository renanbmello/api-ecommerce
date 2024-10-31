import { Request } from 'express';
import { JwtPayload } from './user';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}
