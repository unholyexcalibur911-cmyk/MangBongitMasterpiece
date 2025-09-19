import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Temporary in-memory storage for development
const users = global.users || new Map();

// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const allUsers = Array.from(users.values()).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isActive: user.isActive !== false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt || new Date()
    }));
    
    return res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = Array.from(users.values()).find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isActive: user.isActive !== false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt || new Date()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;
    
    const user = Array.from(users.values()).find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user fields
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Update in storage
    users.set(user.email, user);
    const globalUsers = global.users || new Map();
    globalUsers.set(user.email, user);
    global.users = globalUsers;
    
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isActive: user.isActive !== false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt || new Date()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = Array.from(users.values()).find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow admin to delete themselves
    if (user.id === req.user.sub) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Remove from storage
    users.delete(user.email);
    const globalUsers = global.users || new Map();
    globalUsers.delete(user.email);
    global.users = globalUsers;
    
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get system statistics (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const allUsers = Array.from(users.values());
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.isActive !== false).length;
    const adminUsers = allUsers.filter(u => u.role === 'admin').length;
    const regularUsers = allUsers.filter(u => u.role === 'user').length;
    
    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      regularUsers,
      lastUpdated: new Date()
    };
    
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
