"use client";
import MyIssues from '@/app/turkus/issues/components/MyIssues';

export default function MyIssuesPage() {
  return (
    <>
      <div className="centered-content">
        <div className="max-w-4xl w-full px-8 mt-10">
          <MyIssues />
        </div>
      </div>
    </>
  );
}
