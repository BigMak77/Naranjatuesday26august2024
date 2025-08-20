"use client";
import MyIssues from '@/app/turkus/issues/components/MyIssues';

export default function MyIssuesPage() {
  return (
    <>
      <div className="centered-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ maxWidth: '900px', width: '100%', padding: '0 2rem', marginTop: '2.5rem' }}>
          <MyIssues />
        </div>
      </div>
    </>
  );
}
