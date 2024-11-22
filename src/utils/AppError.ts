import { AppError } from '../types/error';

export class ApplicationError extends Error implements AppError {
    status: number;
    
    constructor(message: string, status: number = 500) {
        super(message);
        this.status = status;
        this.name = 'ApplicationError';
        
        Object.setPrototypeOf(this, ApplicationError.prototype);
    }
}
