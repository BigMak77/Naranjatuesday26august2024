"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiDownload, FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";

// Types
interface TrainingData {
  assignmentId: string;
  authId: string;
  userId: string;
  userName: string;
  moduleId: string;
  moduleName: string;
}

interface TrainingAssignment {
  id: string;
  item_id: string;
  item_type: 'module' | 'document';
  item_name: string;
  assigned_date: string;
  completed_at: string | null;
  status: 'completed' | 'incomplete' | 'overdue';
  due_date?: string | null;
}

interface TrainingLog {
  id: string;
  date: string;
  topic: string;
  duration_hours: number;
  outcome: 'completed' | 'needs_improvement' | 'failed';
  notes: string | null;
  has_signature: boolean;
}

interface TrainingRecordProps {
  open: boolean;
  onClose: () => void;
  trainingData: TrainingData | null;
  onSuccess?: (message: string) => void;
  onDataRefresh?: () => void;
}

export default function TrainingRecord({
  open,
  onClose,
  trainingData,
}: TrainingRecordProps) {
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'history'>('assignments');

  // Fetch user's training data
  useEffect(() => {
    if (trainingData && open) {
      fetchTrainingData();
    }
  }, [trainingData, open]);

  const fetchTrainingData = async () => {
    if (!trainingData) return;
    
    setLoading(true);
    try {
      console.log("Fetching training data for user:", trainingData.authId);

      // Fetch all assignments for this user
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("user_assignments")
        .select("id, item_id, item_type, completed_at, created_at")
        .eq("auth_id", trainingData.authId)
        .order("created_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get item names (modules and documents)
      const moduleIds = (assignmentsData || [])
        .filter(a => a.item_type === 'module')
        .map(a => a.item_id);
      
      const documentIds = (assignmentsData || [])
        .filter(a => a.item_type === 'document')
        .map(a => a.item_id);

      let moduleNames = new Map<string, string>();
      let documentNames = new Map<string, string>();

      // Fetch module names
      if (moduleIds.length > 0) {
        const { data: modules } = await supabase
          .from("modules")
          .select("id, name")
          .in("id", moduleIds);
        
        if (modules) {
          modules.forEach(m => moduleNames.set(m.id, m.name));
        }
      }

      // Fetch document names
      if (documentIds.length > 0) {
        const { data: documents } = await supabase
          .from("documents")
          .select("id, title")
          .in("id", documentIds);
        
        if (documents) {
          documents.forEach(d => documentNames.set(d.id, d.title));
        }
      }

      // Transform assignments data
      const transformedAssignments: TrainingAssignment[] = (assignmentsData || []).map(assignment => {
        const itemName = assignment.item_type === 'module' 
          ? moduleNames.get(assignment.item_id) || assignment.item_id
          : documentNames.get(assignment.item_id) || assignment.item_id;

        let status: 'completed' | 'incomplete' | 'overdue' = 'incomplete';
        if (assignment.completed_at) {
          status = 'completed';
        } else {
          // Could add logic to check if overdue based on due dates
          status = 'incomplete';
        }

        return {
          id: assignment.id,
          item_id: assignment.item_id,
          item_type: assignment.item_type,
          item_name: itemName,
          assigned_date: assignment.created_at,
          completed_at: assignment.completed_at,
          status: status,
        };
      });

      setAssignments(transformedAssignments);

      // Fetch detailed training logs
      const { data: logsData, error: logsError } = await supabase
        .from("training_logs")
        .select("id, date, topic, duration_hours, outcome, notes, signature, trainer_signature")
        .eq("auth_id", trainingData.authId)
        .order("date", { ascending: false });

      if (logsError) throw logsError;

      // Transform logs data
      const transformedLogs: TrainingLog[] = (logsData || []).map(log => ({
        id: log.id,
        date: log.date,
        topic: log.topic,
        duration_hours: log.duration_hours || 0,
        outcome: log.outcome,
        notes: log.notes,
        has_signature: !!(log.signature || log.trainer_signature),
      }));

      setTrainingLogs(transformedLogs);

    } catch (error) {
      console.error("Error fetching training data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRecord = () => {
    if (!trainingData || assignments.length === 0) return;

    // Get the logo URL
    const logoUrl = `${window.location.origin}/logo-dec-2025.png`;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download PDF');
      return;
    }

    // Build HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Training Record - ${trainingData.userName}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              color: #333;
            }
            .header {
              background: linear-gradient(118deg, #05363a 0%, #0a706a 48%, #16cbcf 100%);
              border-bottom: 6px solid #fa7a20;
              padding: 20px 40px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .header img {
              height: 50px;
            }
            .content {
              padding: 40px;
            }
            h1 {
              color: #05363a;
              border-bottom: 3px solid #fa7a20;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .meta {
              color: #666;
              margin-bottom: 30px;
              font-size: 0.9em;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #fff;
              color: #333;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-completed {
              color: #10b981;
              font-weight: bold;
            }
            .status-incomplete {
              color: #f59e0b;
              font-weight: bold;
            }
            .status-overdue {
              color: #ef4444;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 0;
              }
              .header {
                padding: 15px 30px;
              }
              .content {
                padding: 30px;
              }
              @page {
                margin: 1cm;
              }
            }
            @media screen {
              .print-instructions {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 5px;
                color: #856404;
              }
            }
            @media print {
              .print-instructions {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-instructions">
            <strong>Instructions:</strong> Use Ctrl+P (or Cmd+P on Mac) to print, then select "Save as PDF" as the destination.
          </div>
          <div class="header">
            <img src="${logoUrl}" alt="Naranja" onerror="this.style.display='none'" />
          </div>
          <div class="content">
            <h1>Training Record</h1>
            <div class="meta">
              <strong>Employee:</strong> ${trainingData.userName}<br>
              <strong>Generated:</strong> ${new Date().toLocaleString()}
            </div>
            <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Item</th>
                <th>Assigned Date</th>
                <th>Completed Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(a => `
                <tr>
                  <td>${a.item_type === 'module' ? 'Module' : 'Document'}</td>
                  <td>${a.item_name}</td>
                  <td>${new Date(a.assigned_date).toLocaleDateString()}</td>
                  <td>${a.completed_at ? new Date(a.completed_at).toLocaleDateString() : 'N/A'}</td>
                  <td class="status-${a.status}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle style={{ color: '#10b981' }} size={16} />;
      case 'overdue':
        return <FiAlertCircle style={{ color: '#ef4444' }} size={16} />;
      default:
        return <FiClock style={{ color: '#f59e0b' }} size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'overdue':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'needs_improvement':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  if (!trainingData) {
    return null;
  }

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const incompleteCount = assignments.filter(a => a.status === 'incomplete').length;
  const overdueCount = assignments.filter(a => a.status === 'overdue').length;

  return (
    <OverlayDialog
      open={open}
      onClose={onClose}
      width={1200}
      showCloseButton
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', overflow: 'hidden', margin: '-2rem', padding: '0' }}>
        
        {/* Header */}
        <div style={{ 
          padding: '2rem 2rem 1rem 2rem', 
          borderBottom: '1px solid rgba(64, 224, 208, 0.2)',
          flexShrink: 0 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                marginBottom: '8px', 
                color: 'var(--neon)' 
              }}>
                Training Record - {trainingData.userName}
              </h2>
              <p style={{ 
                color: 'var(--text-white)', 
                opacity: 0.7, 
                fontSize: '0.9rem' 
              }}>
                Complete training history and current assignments
              </p>
            </div>
            <button
              onClick={handleDownloadRecord}
              className="neon-btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '12px 20px'
              }}
            >
              <FiDownload size={16} />
              Download Record
            </button>
          </div>

          {/* Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            marginTop: '16px'
          }}>
            <div style={{ 
              padding: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>
                {completedCount}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Completed</div>
            </div>
            <div style={{ 
              padding: '16px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b' }}>
                {incompleteCount}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>In Progress</div>
            </div>
            <div style={{ 
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>
                {overdueCount}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Overdue</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            marginTop: '24px'
          }}>
            <button
              onClick={() => setActiveTab('assignments')}
              className={activeTab === 'assignments' ? 'neon-btn' : 'neon-btn neon-btn-back'}
              style={{ 
                padding: '12px 24px',
                fontSize: '0.9rem'
              }}
            >
              Current Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={activeTab === 'history' ? 'neon-btn' : 'neon-btn neon-btn-back'}
              style={{ 
                padding: '12px 24px',
                fontSize: '0.9rem'
              }}
            >
              Training History ({trainingLogs.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem 2rem 2rem 2rem' 
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              color: 'var(--text-white)',
              opacity: 0.7
            }}>
              Loading training data...
            </div>
          ) : (
            <>
              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <div>
                  {assignments.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px',
                      color: 'var(--text-white)',
                      opacity: 0.7
                    }}>
                      No training assignments found for this user.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 120px 120px 120px 100px',
                            gap: '16px',
                            alignItems: 'center',
                            padding: '16px',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(64, 224, 208, 0.2)',
                            borderRadius: '8px',
                            borderLeftColor: getStatusColor(assignment.status),
                            borderLeftWidth: '4px'
                          }}
                        >
                          <div>
                            <div style={{ 
                              fontWeight: 600, 
                              marginBottom: '4px',
                              color: 'var(--text-white)'
                            }}>
                              {assignment.item_name}
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              opacity: 0.7,
                              textTransform: 'capitalize'
                            }}>
                              {assignment.item_type}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                            {new Date(assignment.assigned_date).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                            {assignment.completed_at 
                              ? new Date(assignment.completed_at).toLocaleDateString()
                              : '-'
                            }
                          </div>
                          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                            {assignment.due_date 
                              ? new Date(assignment.due_date).toLocaleDateString()
                              : '-'
                            }
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: getStatusColor(assignment.status)
                          }}>
                            {getStatusIcon(assignment.status)}
                            <span style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}>
                              {assignment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Training History Tab */}
              {activeTab === 'history' && (
                <div>
                  {trainingLogs.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px',
                      color: 'var(--text-white)',
                      opacity: 0.7
                    }}>
                      No detailed training history found for this user.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {trainingLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            padding: '16px',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(64, 224, 208, 0.2)',
                            borderRadius: '8px',
                            borderLeftColor: getOutcomeColor(log.outcome),
                            borderLeftWidth: '4px'
                          }}
                        >
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: '1fr 120px 100px 100px',
                            gap: '16px',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              fontWeight: 600, 
                              color: 'var(--text-white)'
                            }}>
                              {log.topic}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                              {new Date(log.date).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                              {log.duration_hours}h
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 500,
                              color: getOutcomeColor(log.outcome),
                              textTransform: 'capitalize'
                            }}>
                              {log.outcome.replace('_', ' ')}
                            </div>
                          </div>
                          {log.notes && (
                            <div style={{ 
                              fontSize: '0.875rem', 
                              opacity: 0.7,
                              marginTop: '8px',
                              padding: '8px',
                              backgroundColor: 'rgba(64, 224, 208, 0.05)',
                              borderRadius: '4px'
                            }}>
                              {log.notes}
                            </div>
                          )}
                          {log.has_signature && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              opacity: 0.6,
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <FiCheckCircle size={12} />
                              Digitally signed
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </OverlayDialog>
  );
}
