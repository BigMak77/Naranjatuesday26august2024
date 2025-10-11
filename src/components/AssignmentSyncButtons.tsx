import { useState } from 'react';

interface AssignmentSyncButtonsProps {
  userId?: string;
  onComplete?: (result: any) => void;
}

export default function AssignmentSyncButtons({ userId, onComplete }: AssignmentSyncButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any> | null>(null);

  const callAPI = async (action: string, data?: any) => {
    setLoading(action);
    try {
      const response = await fetch('/api/staged-role-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });
      
      const result = await response.json();
      setResults((prev: Record<string, any> | null) => ({ ...prev, [action]: result }));
      
      if (onComplete) {
        onComplete({ action, result });
      }
      
      return result;
    } catch (error) {
      console.error(`${action} failed:`, error);
      setResults((prev: Record<string, any> | null) => ({ 
        ...prev, 
        [action]: { error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    } finally {
      setLoading(null);
    }
  };

  const handleScan = () => callAPI('scan');
  
  const handleSyncUser = () => {
    if (!userId) {
      alert('User ID is required');
      return;
    }
    callAPI('sync-assignments', { userId });
  };
  
  const handleBulkFix = () => callAPI('bulk-fix');

  const Button = ({ 
    onClick, 
    children, 
    variant = 'primary',
    disabled = false 
  }: {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }) => {
    const baseClasses = 'px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-500 text-white hover:bg-gray-600',
      danger: 'bg-red-500 text-white hover:bg-red-600'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading !== null}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {loading ? '⏳ Processing...' : children}
      </button>
    );
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Assignment Sync Controls</h3>
      
      <div className="space-y-4">
        {/* Scan Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleScan} variant="secondary">
            🔍 Scan for Legacy Assignments
          </Button>
          {results?.scan && (
            <span className={`text-sm ${
              results.scan.problemUsers > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {results.scan.problemUsers > 0 
                ? `Found ${results.scan.problemUsers} users with issues`
                : 'All users have correct assignments'
              }
            </span>
          )}
        </div>

        {/* Single User Sync */}
        {userId && (
          <div className="flex items-center gap-4">
            <Button onClick={handleSyncUser} variant="primary">
              🔧 Fix This User's Assignments
            </Button>
            {results?.['sync-assignments'] && (
              <span className="text-sm text-green-600">
                ✅ User assignments synced successfully
              </span>
            )}
          </div>
        )}

        {/* Bulk Fix */}
        <div className="flex items-center gap-4">
          <Button onClick={handleBulkFix} variant="danger">
            🚨 Bulk Fix All Users
          </Button>
          {results?.['bulk-fix'] && (
            <span className="text-sm text-green-600">
              ✅ Fixed {results['bulk-fix'].results?.fixed || 0} users
            </span>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Results:</h4>
          <pre className="text-sm overflow-auto max-h-60">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How to Use:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. <strong>Scan:</strong> Check which users have legacy assignments</li>
          <li>2. <strong>Fix User:</strong> Fix assignments for a specific user</li>
          <li>3. <strong>Bulk Fix:</strong> Fix all users with legacy assignments at once</li>
        </ol>
      </div>
    </div>
  );
}
