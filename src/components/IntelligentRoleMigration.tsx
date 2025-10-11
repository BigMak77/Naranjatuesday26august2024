import { useState } from 'react';
import { FiArrowRight, FiArchive, FiPlus, FiCheck } from 'react-icons/fi';

interface MigrationResult {
  kept: number;
  archived: number;
  added: number;
  oldRoleId: string;
  newRoleId: string;
}

export default function IntelligentRoleMigration() {
  const [userId, setUserId] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState('');

  const handleMigration = async () => {
    if (!userId || !newRoleId) {
      setError('Both User ID and New Role ID are required');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/migrate-role-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRoleId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult(data.migration);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserId('');
    setNewRoleId('');
    setResult(null);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <FiArrowRight className="mr-3 text-blue-600" />
        Intelligent Role Migration
      </h2>
      
      <p className="text-gray-600 mb-6">
        Migrate user to a new role while intelligently handling assignments:
        <br />• <strong>Keep</strong> assignments that are still applicable
        <br />• <strong>Archive</strong> assignments that are no longer relevant
        <br />• <strong>Add</strong> new assignments required for the new role
      </p>

      {/* Input Form */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">New Role ID</label>
          <input
            type="text"
            value={newRoleId}
            onChange={(e) => setNewRoleId(e.target.value)}
            placeholder="Enter new role ID"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleMigration}
          disabled={loading || !userId || !newRoleId}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Migrating...
            </>
          ) : (
            <>
              <FiArrowRight className="mr-2" />
              Migrate Role
            </>
          )}
        </button>

        <button
          onClick={resetForm}
          disabled={loading}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex items-center mb-3">
            <FiCheck className="text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-green-800">Migration Completed Successfully!</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <FiCheck className="text-green-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{result.kept}</div>
                  <div className="text-sm text-gray-600">Assignments Kept</div>
                  <div className="text-xs text-gray-500">Still applicable for new role</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <FiArchive className="text-orange-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{result.archived}</div>
                  <div className="text-sm text-gray-600">Assignments Archived</div>
                  <div className="text-xs text-gray-500">No longer relevant</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <FiPlus className="text-blue-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{result.added}</div>
                  <div className="text-sm text-gray-600">New Assignments</div>
                  <div className="text-xs text-gray-500">Required for new role</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <strong>Summary:</strong> User migrated from role {result.oldRoleId} to {result.newRoleId}.
            Total assignments after migration: {result.kept + result.added}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How Intelligent Migration Works:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. <strong>Analyze:</strong> Compare current assignments with new role requirements</li>
          <li>2. <strong>Keep:</strong> Assignments that are still applicable remain active</li>
          <li>3. <strong>Archive:</strong> Irrelevant assignments are moved to archive (with full audit trail)</li>
          <li>4. <strong>Add:</strong> New assignments required for the role are added</li>
          <li>5. <strong>Update:</strong> User role is updated and all changes are logged</li>
        </ol>
      </div>
    </div>
  );
}
