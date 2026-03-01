import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats, fetchIssues } from '../api/client';

const STAT_CARDS = [
  { key: 'total_issues', label: 'Total Issues', color: 'bg-blue-500' },
  { key: 'open_issues', label: 'Open', color: 'bg-green-500' },
  { key: 'in_progress_issues', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'blocked_issues', label: 'Blocked', color: 'bg-red-500' },
  { key: 'resolved_issues', label: 'Resolved', color: 'bg-purple-500' },
  { key: 'overdue_issues', label: 'Overdue', color: 'bg-orange-500' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchIssues()])
      .then(([statsRes, issuesRes]) => {
        setStats(statsRes.data);
        setRecentIssues(issuesRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-3 text-sm text-gray-500">
          <span>{stats?.total_teams || 0} Teams</span>
          <span>{stats?.total_users || 0} Users</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="bg-white rounded-lg shadow-sm p-4">
            <div className={`text-3xl font-bold ${card.color.replace('bg-', 'text-')}`}>
              {stats?.[card.key] || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {stats?.critical_issues > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <span className="font-semibold text-red-700">
            {stats.critical_issues} critical issue{stats.critical_issues > 1 ? 's' : ''} need attention
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Issues</h2>
          <Link to="/issues" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {recentIssues.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No issues yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/issues/${issue.id}`} className="text-blue-600 hover:underline">{issue.title}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {issue.due_date ? new Date(issue.due_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
