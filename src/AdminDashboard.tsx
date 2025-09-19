import React, { useState, useEffect } from "react";
import styles from "./AdminDashboard.module.css";
import { globalActivityTracker } from "./globalActivityTracker";
import { getAllTeams } from './services/teamService';
import type { Activity } from "./globalActivityTracker";
import type { Team } from "./types/team";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  lastUpdated: string;
}

const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [notifications] = useState<string[]>([
    "⚠ Security Alert: Multiple failed login attempts detected.",
    "✅ Backup completed successfully at 3:00 AM.",
  ]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem("authToken");
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    const res = await fetch(input, { ...init, headers });
    return res;
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError("Failed to load users");
      }
    } catch (e) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await authFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const loadTeams = async () => {
    try {
      const allTeams = await getAllTeams();
      setTeams(allTeams);
    } catch (e) {
      console.error("Failed to load teams:", e);
    }
  };

  useEffect(() => {
    // Load current user profile
    const loadCurrentUser = async () => {
      try {
        const res = await authFetch("/api/users/me");
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);

          // Activity service connection
          console.log('Admin user loaded:', userData.email);
        }
      } catch (e) {
        console.error("Failed to load current user:", e);
      }
    };

    // Debug: Check if user has admin access
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Admin Dashboard - User role:", payload.role);
        if (payload.role !== 'admin') {
          console.warn("Non-admin user attempting to access admin dashboard");
        }
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }

    loadCurrentUser();
    loadUsers();
    loadStats();
    loadTeams();
  }, []);

  useEffect(() => {
    // Set up activity listeners
    globalActivityTracker.onNewActivity((activity: Activity) => {
      setActivityLog(prev => [activity, ...prev.slice(0, 99)]); // Keep last 100 activities
    });

    // Load recent activities
    const recentActivities = globalActivityTracker.getRecentActivities();
    setActivityLog(recentActivities);

    // Cleanup on unmount
    return () => {
      globalActivityTracker.removeAllListeners();
    };
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setEditingUser({
      id: "",
      email: "",
      name: "",
      role: "user",
      isActive: true,
    });
    setShowUserModal(true);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      for (const userId of selectedUsers) {
        if (bulkAction === "delete") {
          await authFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        } else if (bulkAction === "deactivate") {
          await authFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
          });
        } else if (bulkAction === "activate") {
          await authFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
          });
        }
      }

      await loadUsers();
      await loadStats();
      setSelectedUsers([]);
      setBulkAction("");
      addActivityLog(`Bulk ${bulkAction} performed on ${selectedUsers.length} users`, "admin");
    } catch (e) {
      setError(`Failed to perform bulk ${bulkAction}`);
    }
  };

  const addActivityLog = (action: string, user: string, target: string = "") => {
    const newLog: Activity = {
      id: Date.now(),
      action,
      user,
      target,
      timestamp: new Date().toISOString(),
      type: 'admin'
    };
    setActivityLog(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  const exportUsers = () => {
    const csvContent = [
      ["Email", "Name", "Role", "Status", "Last Login", "Created"],
      ...users.map(user => [
        user.email,
        user.name || "",
        user.role,
        user.isActive ? "Active" : "Inactive",
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "",
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const isNewUser = !editingUser.id;
      const res = await authFetch(`/api/admin/users/${editingUser.id || 'new'}`, {
        method: isNewUser ? "POST" : "PATCH",
        body: JSON.stringify({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          isActive: editingUser.isActive,
        }),
      });

      if (res.ok) {
        await loadUsers();
        await loadStats();
        setEditingUser(null);
        setShowUserModal(false);

        // Track activity
        globalActivityTracker.trackActivity({
          action: isNewUser ? `Created new user: ${editingUser.email}` : `Updated user: ${editingUser.email}`,
          user: currentUser?.email || "admin",
          target: editingUser.email,
          details: `Role: ${editingUser.role}, Status: ${editingUser.isActive ? 'Active' : 'Inactive'}`,
          type: 'admin'
        });

        const action = isNewUser ? "User created" : "User updated";
        addActivityLog(action, "admin", editingUser.email);
      } else {
        setError("Failed to save user");
      }
    } catch (e) {
      setError("Failed to save user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!confirm(`Are you sure you want to delete user: ${user?.email}?`)) return;

    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadUsers();
        await loadStats();

        // Track activity
        globalActivityTracker.trackActivity({
          action: `Deleted user: ${user?.email || 'Unknown'}`,
          user: currentUser?.email || "admin",
          target: user?.email,
          details: `User permanently removed from system`,
          type: 'admin'
        });

        addActivityLog("User deleted", "admin", user?.email || "");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete user");
      }
    } catch (e) {
      setError("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.header}>
          <button onClick={onBack} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>Admin Dashboard</h1>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Admin Dashboard</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Statistics Section */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.blue}`}>
            <h3>Total Users</h3>
            <div className={styles.statNumber}>{stats.totalUsers}</div>
          </div>
          <div className={`${styles.statCard} ${styles.green}`}>
            <h3>Active Users</h3>
            <div className={styles.statNumber}>{stats.activeUsers}</div>
          </div>
          <div className={`${styles.statCard} ${styles.orange}`}>
            <h3>Admins</h3>
            <div className={styles.statNumber}>{stats.adminUsers}</div>
          </div>
          <div className={`${styles.statCard} ${styles.purple}`}>
            <h3>Regular Users</h3>
            <div className={styles.statNumber}>{stats.regularUsers}</div>
          </div>
          <div className={`${styles.statCard} ${styles.red}`}>
            <h3>Teams</h3>
            <div className={styles.statNumber}>{teams.length}</div>
          </div>
          <div className={`${styles.statCard} ${styles.cyan}`}>
            <h3>Activities</h3>
            <div className={styles.statNumber}>{activityLog.length}</div>
          </div>
        </div>
      )}

      {/* Enhanced Controls */}
      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "all" | "admin" | "user")
            }
            className={styles.filterSelect}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>

        <div className={styles.actionSection}>
          <button onClick={handleAddUser} className={styles.addButton}>
            ➕ Add User
          </button>
          <button onClick={exportUsers} className={styles.exportButton}>
            📊 Export Users
          </button>
        </div>
      </div>

      {/* Bulk Operations */}
      {selectedUsers.length > 0 && (
        <div className={styles.bulkOperations}>
          <span>Selected: {selectedUsers.length} users</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className={styles.bulkSelect}
          >
            <option value="">Select Action</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleBulkAction} className={styles.bulkButton}>
            Execute
          </button>
          <button onClick={() => setSelectedUsers([])} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      )}

      {/* Users List */}
      <div className={styles.usersList}>
        {filteredUsers.map((user) => (
          <div key={user.id} className={styles.userCard}>
            <div className={styles.userCheckbox}>
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, user.id]);
                  } else {
                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                  }
                }}
              />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userEmail}>{user.email}</div>
              <div className={styles.userName}>{user.name || "No name"}</div>
              <div className={styles.userRole}>
                <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                  {user.role}
                </span>
                <span
                  className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive
                    }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {user.lastLogin && (
                <div className={styles.lastLogin}>
                  Last login: {new Date(user.lastLogin).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className={styles.userActions}>
              <button
                onClick={() => handleEditUser(user)}
                className={styles.editButton}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className={styles.deleteButton}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className={styles.notifications}>
        <h2>🔔 System Notifications</h2>
        {notifications.map((note, i) => (
          <div key={i} className={styles.notificationCard}>
            {note}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className={styles.activityLog}>
        <h2>📌 Recent Activity</h2>
        <div className={styles.activityList}>
          {activityLog.length === 0 ? (
            <div className={styles.noActivity}>
              <p>No recent activity to display</p>
              <small>Activities will appear here in real-time as users interact with the system</small>
            </div>
          ) : (
            activityLog
              .slice(0, 20)
              .map((log) => {
                const getTypeIcon = (type: string) => {
                  switch (type) {
                    case 'task': return '📝';
                    case 'connection': return '🔗';
                    case 'profile': return '👤';
                    case 'admin': return '👑';
                    case 'system': return '⚙️';
                    case 'team': return '👥';
                    case 'member': return '👤';
                    case 'invitation': return '📧';
                    default: return '📌';
                  }
                };

                const getTypeColor = (type: string) => {
                  switch (type) {
                    case 'task': return '#3b82f6';
                    case 'connection': return '#10b981';
                    case 'profile': return '#8b5cf6';
                    case 'admin': return '#f59e0b';
                    case 'system': return '#6b7280';
                    case 'team': return '#FF6B6B';
                    case 'member': return '#4ECDC4';
                    case 'invitation': return '#FFE66D';
                    default: return '#374151';
                  }
                };

                return (
                  <div key={log.id} className={styles.activityItem}>
                    <div className={styles.activityHeader}>
                      <span
                        className={styles.activityType}
                        style={{ color: getTypeColor(log.type) }}
                      >
                        {getTypeIcon(log.type)} {log.type.toUpperCase()}
                      </span>
                      <span className={styles.activityTime}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.activityContent}>
                      <span className={styles.activityAction}>{log.action}</span>
                      <span className={styles.activityUser}>by {log.user}</span>
                      {log.target && log.target !== log.user && (
                        <span className={styles.activityTarget}>→ {log.target}</span>
                      )}
                    </div>
                    {log.details && (
                      <div className={styles.activityDetails}>
                        <small>{log.details}</small>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Admin Panel Section */}
      <div className={styles.adminPanel}>
        <h2>🔧 Admin Panel</h2>
        <div className={styles.adminFeatures}>
          <div className={styles.adminCard}>
            <h3>System Management</h3>
            <p>Access advanced administrative features and system controls.</p>
            <div className={styles.adminActions}>
              <button className={styles.adminButton} onClick={handleAddUser}>
                👥 Add User
              </button>
              <button className={styles.adminButton} onClick={() => setShowAnalytics(true)}>
                📊 View Analytics
              </button>
              <button className={styles.adminButton} onClick={() => setShowSettings(true)}>
                ⚙️ System Settings
              </button>
            </div>
          </div>
          <div className={styles.adminCard}>
            <h3>Quick Stats</h3>
            <div className={styles.adminStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{stats?.totalUsers || 0}</span>
                <span className={styles.statLabel}>Total Users</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{stats?.activeUsers || 0}</span>
                <span className={styles.statLabel}>Active Today</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{stats?.adminUsers || 0}</span>
                <span className={styles.statLabel}>Admins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserModal && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingUser.id ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowUserModal(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled={!!editingUser.id}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Name:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as "user" | "admin" })}
                  className={styles.formSelect}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowUserModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSaveUser} className={styles.saveButton}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>📈 System Analytics</h3>
              <button onClick={() => setShowAnalytics(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <h4>User Growth</h4>
                  <div className={styles.chartPlaceholder}>
                    📊 User registration trend over time
                  </div>
                </div>
                <div className={styles.analyticsCard}>
                  <h4>Activity Distribution</h4>
                  <div className={styles.chartPlaceholder}>
                    📈 Active vs Inactive users
                  </div>
                </div>
                <div className={styles.analyticsCard}>
                  <h4>Role Distribution</h4>
                  <div className={styles.chartPlaceholder}>
                    🥧 Admin vs User ratio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>⚙️ System Settings</h3>
              <button onClick={() => setShowSettings(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.settingsSection}>
                <h4>User Management</h4>
                <div className={styles.settingItem}>
                  <label>Auto-deactivate inactive users after:</label>
                  <select className={styles.formSelect}>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <label>Require email verification:</label>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
              <div className={styles.settingsSection}>
                <h4>Security</h4>
                <div className={styles.settingItem}>
                  <label>Session timeout (minutes):</label>
                  <input type="number" defaultValue="60" className={styles.formInput} />
                </div>
                <div className={styles.settingItem}>
                  <label>Enable two-factor authentication:</label>
                  <input type="checkbox" />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowSettings(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={() => setShowSettings(false)} className={styles.saveButton}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;