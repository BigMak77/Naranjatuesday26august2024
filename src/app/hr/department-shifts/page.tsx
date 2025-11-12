"use client";

import RotaByDepartment from '@/components/people/RotaByDepartment';
import AccessControlWrapper from '@/components/AccessControlWrapper';

export default function DepartmentShiftsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to view department shifts."
    >
      <RotaByDepartment departmentId="your-department-id" />
    </AccessControlWrapper>
  );
}
