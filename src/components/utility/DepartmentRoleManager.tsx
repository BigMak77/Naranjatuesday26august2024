"use client";

import { useEffect, useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import { supabase } from "@/lib/supabase-client";
import { FiUsers, FiSearch } from "react-icons/fi";

interface Department {
  id: string;
  name: string;
  created_at: string;
  [key: string]: unknown;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
  created_at: string;
  department?: {
    name: string;
  };
  [key: string]: unknown;
}

type DialogType = 'department-add' | 'department-edit' | 'role-add' | 'role-edit' | null;

export default function DepartmentRoleManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // View toggle state
  const [activeView, setActiveView] = useState<'departments' | 'roles'>('departments');

  // Search states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // Dialog states
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingItem, setEditingItem] = useState<Department | Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    department_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptResult, roleResult] = await Promise.all([
        supabase
          .from("departments")
          .select("id, name, created_at")
          .order("name", { ascending: true }),
        supabase
          .from("roles")
          .select("id, title, department_id, created_at")
          .order("title", { ascending: true })
      ]);

      if (deptResult.error) throw deptResult.error;
      if (roleResult.error) throw roleResult.error;

      const departmentsData = deptResult.data || [];
      const rolesData = roleResult.data || [];

      // Create a map of departments for quick lookup
      const deptMap = new Map(departmentsData.map(dept => [dept.id, dept]));

      // Manually join department data with roles
      const rolesWithDepartments = rolesData.map(role => ({
        ...role,
        department: role.department_id ? deptMap.get(role.department_id) : undefined
      }));

      setDepartments(departmentsData);
      setRoles(rolesWithDepartments);
    } catch (err: any) {
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type: DialogType, item?: Department | Role) => {
    setDialogType(type);
    setEditingItem(item || null);
    setError(null);
    
    if (type === 'department-add') {
      setFormData({ name: '', title: '', department_id: '' });
    } else if (type === 'department-edit' && item) {
      setFormData({ name: (item as Department).name, title: '', department_id: '' });
    } else if (type === 'role-add') {
      setFormData({ name: '', title: '', department_id: '' });
    } else if (type === 'role-edit' && item) {
      const role = item as Role;
      setFormData({ name: '', title: role.title, department_id: role.department_id });
    }
  };

  const closeDialog = () => {
    setDialogType(null);
    setEditingItem(null);
    setFormData({ name: '', title: '', department_id: '' });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (dialogType === 'department-add') {
        const { error } = await supabase
          .from("departments")
          .insert({ name: formData.name.trim() });
        if (error) throw error;
      } else if (dialogType === 'department-edit' && editingItem) {
        const { error } = await supabase
          .from("departments")
          .update({ name: formData.name.trim() })
          .eq("id", editingItem.id);
        if (error) throw error;
      } else if (dialogType === 'role-add') {
        const { error } = await supabase
          .from("roles")
          .insert({ 
            title: formData.title.trim(),
            department_id: formData.department_id
          });
        if (error) throw error;
      } else if (dialogType === 'role-edit' && editingItem) {
        const { error } = await supabase
          .from("roles")
          .update({ 
            title: formData.title.trim(),
            department_id: formData.department_id
          })
          .eq("id", editingItem.id);
        if (error) throw error;
      }

      await loadData();
      closeDialog();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: 'department' | 'role', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(type === 'department' ? "departments" : "roles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      setError(`Failed to delete ${type}: ${err.message}`);
    }
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.title.toLowerCase().includes(roleSearch.toLowerCase()) ||
    role.department?.name?.toLowerCase().includes(roleSearch.toLowerCase())
  );

  // Department table columns
  const departmentColumns = [
    {
      header: "Department Name",
      accessor: "name",
      width: "60%"
    },
    {
      header: "Created",
      accessor: "created_at",
      render: (value: unknown) => new Date(value as string).toLocaleDateString()
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-2">
          <TextIconButton
            variant="edit"
            label="Edit"
            onClick={() => openDialog('department-edit', row as unknown as Department)}
          />
          <TextIconButton
            variant="delete"
            label="Delete"
            onClick={() => handleDelete('department', value as string)}
          />
        </div>
      )
    }
  ];

  // Role table columns
  const roleColumns = [
    {
      header: "Role Title",
      accessor: "title",
      width: "40%"
    },
    {
      header: "Department",
      accessor: "department",
      render: (value: unknown) => (value as any)?.name || "No Department"
    },
    {
      header: "Created",
      accessor: "created_at",
      render: (value: unknown) => new Date(value as string).toLocaleDateString()
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-2">
          <TextIconButton
            variant="edit"
            label="Edit"
            onClick={() => openDialog('role-edit', row as unknown as Role)}
          />
          <TextIconButton
            variant="delete"
            label="Delete"
            onClick={() => handleDelete('role', value as string)}
          />
        </div>
      )
    }
  ];


  if (loading) {
    return (
      <NeonPanel>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading departments and roles...</div>
        </div>
      </NeonPanel>
    );
  }

  return (
    <AccessControlWrapper
      requiredRoles={['Super Admin', 'Admin']}
      noAccessMessage="You need admin privileges to manage departments and roles."
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Unified Toolbar with Toggle Switch */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiUsers />
                {activeView === 'departments' ? 'Departments' : 'Roles'}
              </h3>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('departments')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'departments'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Departments
                </button>
                <button
                  onClick={() => setActiveView('roles')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeView === 'roles'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Roles
                </button>
              </div>

              <span className="text-sm text-gray-500">
                ({activeView === 'departments' ? filteredDepartments.length : filteredRoles.length})
              </span>
            </div>

            <TextIconButton
              variant="add"
              label={activeView === 'departments' ? 'Add Department' : 'Add Role'}
              onClick={() => openDialog(activeView === 'departments' ? 'department-add' : 'role-add')}
            />
          </div>
        </div>

        {/* Departments Section */}
        {activeView === 'departments' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search departments..."
                value={departmentSearch}
                onChange={(e) => setDepartmentSearch(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <NeonTable
              columns={departmentColumns}
              data={filteredDepartments as Record<string, unknown>[]}
            />
          </div>
        )}

        {/* Roles Section */}
        {activeView === 'roles' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search roles or departments..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <NeonTable
              columns={roleColumns}
              data={filteredRoles}
            />
          </div>
        )}

        {/* Add/Edit Department Dialog */}
        {(dialogType === 'department-add' || dialogType === 'department-edit') && (
          <OverlayDialog
            open={true}
            onClose={closeDialog}
            width={500}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {dialogType === 'department-add' ? 'Add Department' : 'Edit Department'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    id="departmentName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter department name"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <TextIconButton
                    variant="cancel"
                    label="Cancel"
                    onClick={closeDialog}
                    disabled={saving}
                  />
                  <TextIconButton
                    variant="save"
                    label={saving ? 'Saving...' : (dialogType === 'department-add' ? 'Add Department' : 'Update Department')}
                    type="submit"
                    disabled={saving || !formData.name.trim()}
                  />
                </div>
              </form>
            </div>
          </OverlayDialog>
        )}

        {/* Add/Edit Role Dialog */}
        {(dialogType === 'role-add' || dialogType === 'role-edit') && (
          <OverlayDialog
            open={true}
            onClose={closeDialog}
            width={500}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {dialogType === 'role-add' ? 'Add Role' : 'Edit Role'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="roleTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    id="roleTitle"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="roleDepartment" className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    id="roleDepartment"
                    value={formData.department_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <TextIconButton
                    variant="cancel"
                    label="Cancel"
                    onClick={closeDialog}
                    disabled={saving}
                  />
                  <TextIconButton
                    variant="save"
                    label={saving ? 'Saving...' : (dialogType === 'role-add' ? 'Add Role' : 'Update Role')}
                    type="submit"
                    disabled={saving || !formData.title.trim() || !formData.department_id}
                  />
                </div>
              </form>
            </div>
          </OverlayDialog>
        )}
      </div>
    </AccessControlWrapper>
  );
}
