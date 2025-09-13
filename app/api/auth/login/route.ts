import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';
import { generateToken, comparePassword } from '@/lib/auth';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Handle user login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Make sure we have both email and password
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = await initDatabase();
    
    // Find the user by email and get their company info too
    const user = await db.get(
      'SELECT u.*, t.slug as tenant_slug FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
      [email]
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if the password is correct
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create a JWT token for this user
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id
    });

    // Get the company's current plan
    const tenant = await db.get('SELECT plan FROM tenants WHERE id = ?', [user.tenant_id]);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantSlug: user.tenant_slug,
        tenantPlan: tenant.plan
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}