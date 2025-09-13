
import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';
import { withAdminAuth } from '@/lib/middleware';

// Upgrade a company to the Pro plan (admin only)
export const POST = withAdminAuth(async (request: NextRequest, user, params) => {
  try {
    const db = await initDatabase();
    
    // Make sure the company exists and the admin belongs to it
    const tenant = await db.get(
      'SELECT * FROM tenants WHERE slug = ? AND id = ?',
      [params.slug, user.tenantId]
    );

    if (!tenant) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Upgrade the company to Pro plan
    await db.run(
      'UPDATE tenants SET plan = ? WHERE id = ?',
      ['pro', user.tenantId]
    );

    return NextResponse.json({ 
      message: 'Company upgraded to Pro plan successfully!',
      plan: 'pro'
    });

  } catch (error) {
    console.error('Upgrade company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
