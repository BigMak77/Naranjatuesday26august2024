'use client';
import NeonPanel from '@/components/NeonPanel';
import { FiFileText } from 'react-icons/fi';
import { supabase } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PolicyDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) setError(error.message);
      setPolicy(data);
      setLoading(false);
    };
    if (id) fetchPolicy();
  }, [id]);

  if (loading) return <NeonPanel><p>Loading...</p></NeonPanel>;
  if (error) return <NeonPanel><p className="neon-error">{error}</p></NeonPanel>;
  if (!policy) return <NeonPanel><p>No policy found.</p></NeonPanel>;

  return (
    <NeonPanel>
      <h1 className="flex items-center gap-2 text-xl font-bold mb-4">
        <FiFileText /> {policy.title}
      </h1>
      <p className="mb-2">{policy.description}</p>
      {/* Add more policy details here as needed */}
    </NeonPanel>
  );
}
