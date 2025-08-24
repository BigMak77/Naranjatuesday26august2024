import React, { useEffect, useState } from 'react';
import NeonPanel from '@/components/NeonPanel';
import NeonTable from '@/components/NeonTable';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/lib/useUser';

export default function MyTeamTraining() {
  const { user } = useUser();
  const [teamTraining, setTeamTraining] = useState<Array<{ id: string; team_member: string; module: string; status: string; completed_at?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchTraining = async () => {
      setLoading(true);
      try {
        // Fetch all team members' training that is not completed
        const { data, error } = await supabase
          .from('training')
          .select('id, module, status, completed_at, team_member')
          .eq('manager_id', user.auth_id)
          .neq('status', 'completed');
        if (error) throw error;
        setTeamTraining(data || []);
      } catch {
        setError('Failed to load team training.');
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [user]);

  return (
    <NeonPanel>
      <h2>Team Training (Incomplete)</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : teamTraining.length === 0 ? (
        <p>All team training is completed!</p>
      ) : (
        <NeonTable
          columns={[
            { header: 'Team Member', accessor: 'team_member' },
            { header: 'Module', accessor: 'module' },
            { header: 'Status', accessor: 'status' },
          ]}
          data={teamTraining}
        />
      )}
    </NeonPanel>
  );
}