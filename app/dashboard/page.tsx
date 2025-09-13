'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'member';
  tenantId: number;
  tenantSlug: string;
  tenantPlan?: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  user_id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchNotes();
    fetchTenantPlan(parsedUser);
  }, [router]);

  const fetchTenantPlan = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${user.tenantSlug}/plan`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? { ...prev, tenantPlan: data.plan } : null);
      }
    } catch (err) {
      console.error('Failed to fetch tenant plan:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        setError('Failed to fetch notes');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([data, ...notes]);
        setNewNote({ title: '', content: '' });
        setShowCreateForm(false);
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create note');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== id));
      } else {
        setError('Failed to delete note');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const upgradeTenant = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${user.tenantSlug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Tenant upgraded to Pro plan successfully!');
        // Refresh tenant plan status
        await fetchTenantPlan(user);
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to upgrade tenant');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading && !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  const isFreePlan = user?.tenantPlan === 'free' && notes.length >= 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Notes Dashboard - {user.tenantSlug.toUpperCase()}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email} ({user.role})
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {isFreePlan && user.role === 'admin' && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <div className="flex justify-between items-center">
                <span>Free plan limit reached (3 notes). Upgrade to Pro for unlimited notes.</span>
                <button
                  onClick={upgradeTenant}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}

          {isFreePlan && user.role === 'member' && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Free plan limit reached (3 notes). Contact your admin to upgrade to Pro.
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Notes ({notes.length})</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={isFreePlan}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showCreateForm ? 'Cancel' : 'Create Note'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={createNote} className="mb-6 bg-white p-6 rounded-lg shadow">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Note'}
              </button>
            </form>
          )}

          <div className="grid gap-4">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notes yet. Create your first note!
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {note.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{note.content}</p>
                      <p className="text-sm text-gray-400">
                        Created: {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
