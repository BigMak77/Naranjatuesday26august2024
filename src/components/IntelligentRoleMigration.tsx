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
    <div className="neon-panel" style={{ backgroundColor: 'white', color: '#000' }}>
      <h2 className="neon-heading" style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        alignItems: 'center',
        color: '#000'
      }}>
        <FiArrowRight style={{ marginRight: '0.75rem', color: '#2563eb' }} />
        Intelligent Role Migration
      </h2>
      
      <p className="neon-text" style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
        Migrate user to a new role while intelligently handling assignments:
        <br />• <strong>Keep</strong> assignments that are still applicable
        <br />• <strong>Archive</strong> assignments that are no longer relevant
        <br />• <strong>Add</strong> new assignments required for the new role
      </p>

      {/* Input Form */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div>
          <label className="neon-form-label" style={{ color: '#000' }}>User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="neon-input"
            disabled={loading}
          />
        </div>
        <div>
          <label className="neon-form-label" style={{ color: '#000' }}>New Role ID</label>
          <input
            type="text"
            value={newRoleId}
            onChange={(e) => setNewRoleId(e.target.value)}
            placeholder="Enter new role ID"
            className="neon-input"
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={handleMigration}
          disabled={loading || !userId || !newRoleId}
          className="neon-btn-primary transition-colors"
          style={{ 
            opacity: (loading || !userId || !newRoleId) ? 0.5 : 1,
            cursor: (loading || !userId || !newRoleId) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderBottom: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
              Migrating...
            </>
          ) : (
            <>
              <FiArrowRight style={{ marginRight: '0.5rem' }} />
              Migrate Role
            </>
          )}
        </button>

        <button
          onClick={resetForm}
          disabled={loading}
          className="neon-btn-cancel transition-colors"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="neon-panel" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid var(--text-error)',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="neon-panel" style={{
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          borderLeft: '4px solid var(--text-success)',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <FiCheck style={{ color: '#4ade80', marginRight: '0.5rem' }} />
            <h3 className="neon-heading" style={{ color: '#15803d' }}>Migration Completed Successfully!</h3>
          </div>
          
          <div className="stats-grid" style={{ marginTop: '1rem' }}>
            <div className="neon-panel" style={{ backgroundColor: 'white', color: '#000' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FiCheck style={{ color: '#16a34a', marginRight: '0.5rem' }} />
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{result.kept}</div>
                  <div style={{ fontSize: 'var(--font-size-base)', color: '#4b5563' }}>Assignments Kept</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Still applicable for new role</div>
                </div>
              </div>
            </div>

            <div className="neon-panel" style={{ backgroundColor: 'white', color: '#000' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FiArchive style={{ color: '#ea580c', marginRight: '0.5rem' }} />
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ea580c' }}>{result.archived}</div>
                  <div style={{ fontSize: 'var(--font-size-base)', color: '#4b5563' }}>Assignments Archived</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>No longer relevant</div>
                </div>
              </div>
            </div>

            <div className="neon-panel" style={{ backgroundColor: 'white', color: '#000' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FiPlus style={{ color: '#2563eb', marginRight: '0.5rem' }} />
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{result.added}</div>
                  <div style={{ fontSize: 'var(--font-size-base)', color: '#4b5563' }}>New Assignments</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Required for new role</div>
                </div>
              </div>
            </div>
          </div>

          <div className="neon-panel" style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#f3f4f6', 
            fontSize: 'var(--font-size-base)',
            color: '#000'
          }}>
            <strong>Summary:</strong> User migrated from role {result.oldRoleId} to {result.newRoleId}.
            Total assignments after migration: {result.kept + result.added}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="neon-panel" style={{ 
        marginTop: '2rem', 
        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        border: '1px solid #3b82f6'
      }}>
        <h4 className="neon-heading" style={{ color: '#1e40af', marginBottom: '0.5rem' }}>How Intelligent Migration Works:</h4>
        <ol style={{ fontSize: 'var(--font-size-base)', color: '#1d4ed8', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
