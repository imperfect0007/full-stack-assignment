import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';
import { withAuth } from '@/lib/middleware';

// Get a specific note
export const GET = withAuth(async (request: NextRequest, user, params) => {
  try {
    const db = await initDatabase();
    
    // Find the note, but only if it belongs to the user's company
    const note = await db.get(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ?',
      [params.id, user.tenantId]
    );

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);

  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// Update an existing note
export const PUT = withAuth(async (request: NextRequest, user, params) => {
  try {
    const { title, content } = await request.json();

    // Make sure we have both title and content
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const db = await initDatabase();
    
    // First make sure the note exists and belongs to the user's company
    const existingNote = await db.get(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ?',
      [params.id, user.tenantId]
    );

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Update the note
    await db.run(
      'UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [title, content, params.id, user.tenantId]
    );

    // Get the updated note to return
    const updatedNote = await db.get(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ?',
      [params.id, user.tenantId]
    );

    return NextResponse.json(updatedNote);

  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// Delete a note
export const DELETE = withAuth(async (request: NextRequest, user, params) => {
  try {
    const db = await initDatabase();
    
    // First make sure the note exists and belongs to the user's company
    const existingNote = await db.get(
      'SELECT * FROM notes WHERE id = ? AND tenant_id = ?',
      [params.id, user.tenantId]
    );

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete the note
    await db.run(
      'DELETE FROM notes WHERE id = ? AND tenant_id = ?',
      [params.id, user.tenantId]
    );

    return NextResponse.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
