"use client";
import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit3, FiTrash2, FiCheck, FiX, FiShield } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const RoleWizard: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  // Predefined permissions
  const defaultPermissions = [
    { id: "read_users", name: "Read Users", description: "View user information", category: "Users" },
    { id: "write_users", name: "Write Users", description: "Create and edit users", category: "Users" },
    { id: "delete_users", name: "Delete Users", description: "Delete user accounts", category: "Users" },
    { id: "read_roles", name: "Read Roles", description: "View role information", category: "Roles" },
    { id: "write_roles", name: "Write Roles", description: "Create and edit roles", category: "Roles" },
    { id: "delete_roles", name: "Delete Roles", description: "Delete roles", category: "Roles" },
    { id: "read_content", name: "Read Content", description: "View content", category: "Content" },
    { id: "write_content", name: "Write Content", description: "Create and edit content", category: "Content" },
    { id: "delete_content", name: "Delete Content", description: "Delete content", category: "Content" },
    { id: "admin_access", name: "Admin Access", description: "Full administrative access", category: "System" },
    { id: "system_config", name: "System Config", description: "Configure system settings", category: "System" }
  ];

  useEffect(() => {
    fetchRoles();
    setPermissions(defaultPermissions);
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('roles')
          .update({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRole.id);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase
          .from('roles')
          .insert({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          });

        if (error) throw error;
      }

      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] });
    setShowCreateModal(false);
    setEditingRole(null);
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowCreateModal(true);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FiShield className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(role)}
                  className="text-gray-400 hover:text-orange-600 transition-colors"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((permissionId) => {
                  const permission = permissions.find(p => p.id === permissionId);
                  return (
                    <span
                      key={permissionId}
                      className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs"
                    >
                      {permission?.name || permissionId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissions
                </label>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{permission.name}</p>
                              <p className="text-sm text-gray-600">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleWizard;
