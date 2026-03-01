import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIssue, updateIssue, deleteIssue } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchIssue(id)
      .then((res) => {
        setIssue(res.data);
        setEditData(res.data);
      })
      .catch(() => navigate('/issues'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUpdate = async () => {
    const resp = await updateIssue(id, {
      title: editData.title,
      description: editData.description,
      priority: editData.priority,
      status: editData.status,
    });
    setIssue(resp.data);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      await deleteIssue(id);
      navigate('/issues');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!issue) return null;

  const priorityColor = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  };

  const statusColor = {
    open: 'text-blue-600 bg-blue-50',
    in_progress: 'text-yellow-600 bg-yellow-50',
    blocked: 'text-red-600 bg-red-50',
    resolved: 'text-purple-600 bg-purple-50',
    closed: 'text-gray-600 bg-gray-50',
  };

  return (
    <div>
      <button onClick={() => navigate('/issues')} className="text-sm text-gray-500 hover:text-gray-700 mb-4">
        &larr; Back to Issues
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {editing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full text-2xl font-bold border-b border-gray-300 focus:outline-none focus:border-blue-500 pb-2"
            />
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Description"
            />
            <div className="flex space-x-4">
              <select
                value={editData.priority}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Save</button>
              <button onClick={() => { setEditing(false); setEditData(issue); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{issue.title}</h1>
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
              )}
            </div>
            <div className="flex space-x-3 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[issue.priority]}`}>
                {issue.priority}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[issue.status]}`}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">
                Created by {issue.creator_name || 'Unknown'} on {new Date(issue.created_at).toLocaleDateString()}
              </span>
            </div>
            {issue.description && (
              <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
            )}
            {issue.due_date && (
              <p className="mt-4 text-sm text-gray-500">
                Due: {new Date(issue.due_date).toLocaleDateString()}
              </p>
            )}

            <div className="mt-8 pt-6 border-t">
              <h2 className="text-lg font-semibold mb-4">Workstreams</h2>
              <p className="text-gray-500 text-sm">Workstreams will be available in Phase 2.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
