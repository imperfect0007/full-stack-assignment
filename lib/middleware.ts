import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';

// Middleware to check if user is logged in
export function withAuth(handler: (req: NextRequest, user: TokenPayload, params?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    // Look for the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // User is authenticated, call the actual handler
    return handler(req, user, context?.params);
  };
}

// Middleware to check if user is an admin
export function withAdminAuth(handler: (req: NextRequest, user: TokenPayload, params?: any) => Promise<NextResponse>) {
  return withAuth(async (req: NextRequest, user: TokenPayload, params?: any) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return handler(req, user, params);
  });
}
