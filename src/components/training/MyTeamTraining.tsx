import React, { useEffect, useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";

export default function MyTeamTraining() {
  const { user } = useUser();
  const [teamTraining, setTeamTraining] = useState<
    Array<{
      id: string;
      team_member: string;
      module: string;
      status: string;
      completed_at?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.department_id) return;
    const fetchTraining = async () => {
      setLoading(true);
      try {
        console.log('MyTeamTraining - Fetching team training for department:', user.department_id);
        
        // First, get users in the same department
        const { data: departmentUsers, error: usersError } = await supabase
          .from("users")
          .select("auth_id, first_name, last_name")
          .eq("department_id", user.department_id);
        
        if (usersError) {
          console.error('Error fetching department users:', usersError);
          throw usersError;
        }
        
        console.log('Department users found:', departmentUsers?.length || 0);
        
        const userAuthIds = departmentUsers?.map(u => u.auth_id) || [];
        
        if (userAuthIds.length === 0) {
          setTeamTraining([]);
          return;
        }
        
        // Then get their incomplete assignments
        const { data, error } = await supabase
          .from("user_assignments")
          .select("id, auth_id, item_id, item_type, completed_at, due_at")
          .in("auth_id", userAuthIds)
          .is("completed_at", null)
          .in("item_type", ["module", "document"]);
        
        if (error) {
          console.error('Error fetching user assignments:', error);
          throw error;
        }
        
        console.log('Incomplete assignments found:', data?.length || 0);
        
        // Create a lookup map for users
        const userLookup = new Map();
        departmentUsers?.forEach(user => {
          userLookup.set(user.auth_id, `${user.first_name || ''} ${user.last_name || ''}`.trim());
        });
        
        // Transform the data to match the expected format
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          team_member: userLookup.get(item.auth_id) || 'Unknown User',
          module: item.item_type === 'module' 
            ? `Training Module ${item.item_id}` 
            : `Training Document ${item.item_id}`,
          status: item.completed_at ? 'completed' : 'pending'
        }));
        
        setTeamTraining(transformedData);
      } catch (err: any) {
        console.error('Training fetch error:', err);
        setError("Failed to load team training.");
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
            { header: "Team Member", accessor: "team_member" },
            { header: "Module", accessor: "module" },
            { header: "Status", accessor: "status" },
          ]}
          data={teamTraining}
        />
      )}
    </NeonPanel>
  );
}
