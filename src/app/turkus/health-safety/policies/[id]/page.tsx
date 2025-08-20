import React from 'react';
import NeonPanel from '@/components/NeonPanel';
import { FiFileText } from 'react-icons/fi';
import { supabase } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';

export default function PolicyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [policy, setPolicy] = React.useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchPolicy() {
      if (!id) return;
      const { data, error } = await supabase.from('policies').select('title, description').eq('id', id).single();
      if (error || !data) {
        setError('Policy not found.');
        setPolicy(null);
      } else {
        setPolicy(data);
      }
      setLoading(false);
    }
    fetchPolicy();
  }, [id]);

  return (
    <NeonPanel className="policy-detail-panel">
      <h1 className="policy-detail-title">
        <FiFileText className="policy-detail-title-icon" />
      </h1>
      <div className="policy-detail-content">
        {loading ? (
          <p className="neon-loading">Loading policy...</p>
        ) : error ? (
          <p className="neon-error">{error}</p>
        ) : policy ? (
          <>
            <h2 className="policy-detail-heading">{policy.title}</h2>
            <p className="policy-detail-info">{policy.description}</p>
          </>
        ) : null}
      </div>
    </NeonPanel>
  );
}
