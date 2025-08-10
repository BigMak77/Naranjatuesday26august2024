"use client";
import HeroHeader from '@/components/HeroHeader';
import MyIssues from '@/app/turkus/issues/components/MyIssues';

export default function MyIssuesPage() {
  return (
    <>
      <HeroHeader
        title="My Department Issues"
        subtitle="View issues assigned to your department."
      />
      <div className="centered-content">
        <div className="max-w-4xl w-full px-8 mt-10">
          <MyIssues />
        </div>
      </div>
    </>
  );
}
