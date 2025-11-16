import React, { useEffect, useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import TextIconButton from "@/components/ui/TextIconButtons";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";

type TeamTrainingData = {
  id: string;
  team_member: string;
  item_name: string;
  item_type: string;
  status: string;
  assigned_at: string;
  due_date?: string;
  completed_at?: string;
  completion_rate?: string;
};

export default function MyTeamTraining() {
  const { user } = useUser();
  const [teamTraining, setTeamTraining] = useState<TeamTrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

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
        
        // Get all assignments for team members (training-related)
        const { data: assignments, error: assignmentsError } = await supabase
          .from("user_assignments")
          .select("id, auth_id, item_id, item_type, completed_at, due_at, assigned_at")
          .in("auth_id", userAuthIds)
          .in("item_type", ["module", "document"]);
        
        if (assignmentsError) {
          console.error('Error fetching user assignments:', assignmentsError);
          throw assignmentsError;
        }
        
        console.log('Training assignments found:', assignments?.length || 0);
        
        // Get item details (modules and documents)
        const moduleIds = assignments?.filter(a => a.item_type === 'module').map(a => a.item_id) || [];
        const documentIds = assignments?.filter(a => a.item_type === 'document').map(a => a.item_id) || [];
        
        let moduleDetails: any[] = [];
        let documentDetails: any[] = [];
        
        if (moduleIds.length > 0) {
          const { data: modules, error: moduleError } = await supabase
            .from("training_modules")
            .select("id, module_name")
            .in("id", moduleIds);
          
          if (!moduleError) {
            moduleDetails = modules || [];
          }
        }
        
        if (documentIds.length > 0) {
          const { data: documents, error: docError } = await supabase
            .from("documents")
            .select("id, document_title")
            .in("id", documentIds);
          
          if (!docError) {
            documentDetails = documents || [];
          }
        }
        
        // Create lookup maps
        const userLookup = new Map();
        departmentUsers?.forEach(user => {
          userLookup.set(user.auth_id, `${user.first_name || ''} ${user.last_name || ''}`.trim());
        });
        
        const moduleLookup = new Map();
        moduleDetails.forEach(module => {
          moduleLookup.set(module.id, module.module_name);
        });
        
        const documentLookup = new Map();
        documentDetails.forEach(doc => {
          documentLookup.set(doc.id, doc.document_title);
        });
        
        // Transform the data
        const transformedData: TeamTrainingData[] = (assignments || []).map((item: any) => {
          const itemName = item.item_type === 'module'
            ? moduleLookup.get(item.item_id) || `Module ${item.item_id}`
            : documentLookup.get(item.item_id) || `Document ${item.item_id}`;

          const status = item.completed_at ? 'Completed' : 'Pending';
          const assignedDate = item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : 'N/A';
          const dueDate = item.due_at ? new Date(item.due_at).toLocaleDateString() : undefined;
          const completedDate = item.completed_at ? new Date(item.completed_at).toLocaleDateString() : undefined;

          return {
            id: item.id,
            team_member: userLookup.get(item.auth_id) || 'Unknown User',
            item_name: itemName,
            item_type: item.item_type === 'module' ? 'Training Module' : 'Training Document',
            status: status,
            assigned_at: assignedDate,
            due_date: dueDate,
            completed_at: completedDate,
          };
        });
        
        setTeamTraining(transformedData);
      } catch (err: any) {
        console.error('Training fetch error:', err);
        setError("Failed to load team training data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [user]);

  // Filter data based on selected filter
  const filteredData = teamTraining.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status === 'Pending';
    if (filter === 'completed') return item.status === 'Completed';
    return true;
  });

  return (
    <NeonPanel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>My Team Training Assignments</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <TextIconButton
            variant="list"
            className={filter === 'all' ? '' : 'neon-btn-outline'}
            onClick={() => setFilter('all')}
            label={`Show all assignments (${teamTraining.length})`}
            title={`Show all assignments (${teamTraining.length})`}
          />
          <TextIconButton
            variant="clock"
            className={filter === 'pending' ? '' : 'neon-btn-outline'}
            onClick={() => setFilter('pending')}
            label={`Show pending assignments (${teamTraining.filter(t => t.status === 'Pending').length})`}
            title={`Show pending assignments (${teamTraining.filter(t => t.status === 'Pending').length})`}
          />
          <TextIconButton
            variant="checkCircle"
            className={filter === 'completed' ? '' : 'neon-btn-outline'}
            onClick={() => setFilter('completed')}
            label={`Show completed assignments (${teamTraining.filter(t => t.status === 'Completed').length})`}
            title={`Show completed assignments (${teamTraining.filter(t => t.status === 'Completed').length})`}
          />
        </div>
      </div>
      
      {loading ? (
        <p>Loading team training assignments...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredData.length === 0 ? (
        <p>
          {filter === 'all' 
            ? 'No training assignments found for your team.' 
            : `No ${filter} training assignments found.`}
        </p>
      ) : (
        <NeonTable
          columns={[
            { header: "Team Member", accessor: "team_member" },
            { header: "Training Item", accessor: "item_name" },
            { header: "Type", accessor: "item_type" },
            { header: "Status", accessor: "status" },
            { header: "Assigned", accessor: "assigned_at" },
            { header: "Due Date", accessor: "due_date" },
            { header: "Completed", accessor: "completed_at" },
          ]}
          data={filteredData}
        />
      )}
    </NeonPanel>
  );
}
