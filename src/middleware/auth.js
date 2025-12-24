import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Define the interface for the User payload in your token
interface UserPayload {
  id: string;
  role?: string;
}

// 2. Extend the Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// 3. Typed Middleware Function
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // Use explicit return to satisfy TypeScript void/Response return types
      res.status(401).json({ error: 'No token, authorization denied' });
      return; 
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as UserPayload;
    
    // Attach user to request object
    req.user = decoded;
    
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// If you have other middleware (indicated by errors at lines 35 and 43), apply the same types:
// export const anotherMiddleware = (req: Request, res: Response, next: NextFunction) => { ... }
