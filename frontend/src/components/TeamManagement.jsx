import { useState, useEffect } from 'react';
import { fetchTeams, createTeam } from '../api/client';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadTeams = () => {
    fetchTeams()
      .then((res) => setTeams(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTeam({ name, description: description || null });
      setName('');
      setDescription('');
      setShowForm(false);
      loadTeams();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
        >
          {showForm ? 'Cancel' : 'New Team'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-w-lg">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
              Create Team
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No teams yet
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg">{team.name}</h3>
              {team.description && <p className="text-sm text-gray-500 mt-1">{team.description}</p>}
              <p className="text-sm text-gray-400 mt-2">{team.member_count} member{team.member_count !== 1 ? 's' : ''}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
