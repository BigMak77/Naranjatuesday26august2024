"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiDownload,
  FiUpload,
  FiSearch,
  FiGrid,
  FiFilter,
} from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

export type Dept = { id: string; name: string };

interface TrainerViewToolbarProps {
  onDownloadCSV: () => void;
  onUploadCSV: () => void;
  onSearch?: (searchTerm: string) => void;
  onDepartmentFilter?: (deptId: string) => void;
  departments?: Dept[];
  selectedDepartment?: string;
  busy?: boolean;
}

export default function TrainerViewToolbar({
  onDownloadCSV,
  onUploadCSV,
  onSearch,
  onDepartmentFilter,
  departments = [],
  selectedDepartment = "all",
  busy = false,
}: TrainerViewToolbarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDepartmentFilter?.(e.target.value);
  };

  return (
    <section className="section-toolbar">
      <div className="toolbar-buttons">
        {/* Training Matrix Button */}
        <TextIconButton
          icon={<FiGrid />}
          variant="view"
          label="Training Matrix"
          title="View comprehensive training matrix"
          onClick={() => router.push('/training/matrix')}
          disabled={busy}
        />

        {/* Download CSV Button */}
        <TextIconButton
          icon={<FiDownload />}
          variant="save"
          label="Download CSV"
          title="Download user assignments as CSV"
          onClick={onDownloadCSV}
          disabled={busy}
        />

        {/* Upload CSV Button */}
        <TextIconButton
          icon={<FiUpload />}
          variant="upload"
          label="Upload CSV"
          title="Upload user assignments CSV"
          onClick={onUploadCSV}
          disabled={busy}
        />

        {/* Department Filter */}
        <div className="toolbar-filter" style={{ marginLeft: 'auto' }}>
          <FiFilter style={{ color: '#fa7a20' }} aria-hidden />
          <select
            aria-label="Filter by department"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            disabled={busy}
            className="toolbar-select"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="toolbar-search">
          <FiSearch style={{ color: '#fa7a20' }} aria-hidden />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={busy}
            className="toolbar-input"
          />
        </div>
      </div>
    </section>
  );
}
