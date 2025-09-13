import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';
import { withAuth } from '@/lib/middleware';

// Create a new note
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { title, content } = await request.json();

    // Make sure we have both title and content
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const db = await initDatabase();

    // Check if the company is on the free plan and has hit the limit
    const tenant = await db.get('SELECT plan FROM tenants WHERE id = ?', [user.tenantId]);
    
    if (tenant.plan === 'free') {
      const noteCount = await db.get(
        'SELECT COUNT(*) as count FROM notes WHERE tenant_id = ?',
        [user.tenantId]
      );
      
      if (noteCount.count >= 3) {
        return NextResponse.json({ 
          error: 'Note limit reached. Upgrade to Pro plan to create more notes.' 
        }, { status: 403 });
      }
    }

    // Save the new note to the database
    await db.run(
      'INSERT INTO notes (title, content, user_id, tenant_id) VALUES (?, ?, ?, ?)',
      [title, content, user.userId, user.tenantId]
    );

    // Get the note we just created (using the most recent one for this user)
    const createdNote = await db.get(
      'SELECT * FROM notes WHERE user_id = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT 1',
      [user.userId, user.tenantId]
    );

    return NextResponse.json({
      id: createdNote.id,
      title: createdNote.title,
      content: createdNote.content,
      userId: createdNote.user_id,
      tenantId: createdNote.tenant_id,
      createdAt: createdNote.created_at
    });

  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// Get all notes for the current company
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await initDatabase();
    
    // Only get notes from the user's company
    const notes = await db.all(
      'SELECT * FROM notes WHERE tenant_id = ? ORDER BY created_at DESC',
      [user.tenantId]
    );

    return NextResponse.json(notes);

  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
