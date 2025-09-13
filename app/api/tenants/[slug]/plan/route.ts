import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';
import { withAuth } from '@/lib/middleware';

// Get the current plan for a company
export const GET = withAuth(async (request: NextRequest, user, params) => {
  try {
    const db = await initDatabase();
    
    // Get the company's current plan
    const tenant = await db.get(
      'SELECT plan FROM tenants WHERE slug = ? AND id = ?',
      [params.slug, user.tenantId]
    );

    if (!tenant) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ plan: tenant.plan });

  } catch (error) {
    console.error('Get company plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
