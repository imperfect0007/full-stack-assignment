import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Get our secret key from environment or use a default (not recommended for production!)
const JWT_SECRET = process.env.JWT_SECRET || 'S3cureR@nd0mK3y!2025$ZxWq';

// Basic user info we store in the database
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'member';
  tenant_id: number;
}

// What we put inside the JWT token
export interface TokenPayload {
  userId: number;
  email: string;
  role: 'admin' | 'member';
  tenantId: number;
}

// Create a JWT token for a user after they log in
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id
  };
  
  // Token expires in 24 hours
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Check if a token is valid and return the user info
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

// Hash a password before storing it
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Check if a password matches the stored hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
