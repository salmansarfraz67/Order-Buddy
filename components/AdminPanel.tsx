import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User, ViewState } from '../types';
import { CheckCircle, Search, Shield, ArrowLeft, Loader, AlertTriangle, Copy, Check, LogIn, Crown, Ban, RefreshCw, Trash2, Edit2, Save, X, Database } from 'lucide-react';

interface AdminPanelProps {
  onExit: () => void;
  onNavigate: (view: ViewState) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit, onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [search, setSearch] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFirebaseLoggedIn, setIsFirebaseLoggedIn] = useState(false);

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
      shopName: string;
      phone: string;
      subscriptionStatus: string;
      daysRemaining: number;
  }>({ shopName: '', phone: '', subscriptionStatus: 'trial', daysRemaining: 0 });

  // Simple PIN protection for the admin panel
  const ADMIN_PIN = "7860"; 

  // Helper to calculate days remaining dynamically
  const calculateDaysRemaining = (user: User): number => {
    const now = new Date().getTime();
    
    if (user.subscriptionExpiryDate) {
        const expiry = new Date(user.subscriptionExpiryDate).getTime();
        const diff = expiry - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    
    // Fallback: Default Trial Calculation
    if (user.createdAt) {
        const start = new Date(user.createdAt).getTime();
        const end = start + (7 * 24 * 60 * 60 * 1000);
        const diff = end - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    
    return 7; // Default fallback
  };

  // Check auth state on mount
  useEffect(() => {
      const user = auth.currentUser;
      if (user) {
          setIsFirebaseLoggedIn(true);
      } else {
          setIsFirebaseLoggedIn(false);
      }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setPermissionError(false);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList: User[] = [];
      querySnapshot.forEach((doc) => {
        // Combine doc ID with data
        const data = doc.data();
        
        // Create base user object
        const rawUser: User = {
            uid: doc.id,
            shopName: data.shopName || 'Unknown Shop',
            email: data.email || 'No Email',
            phone: data.phone || '',
            subscriptionStatus: data.subscriptionStatus || 'trial',
            subscriptionExpiryDate: data.subscriptionExpiryDate, // Fetch the date string
            createdAt: data.createdAt 
        } as User;

        // Calculate dynamic days for display
        rawUser.daysRemaining = calculateDaysRemaining(rawUser);

        userList.push(rawUser);
      });
      setUsers(userList);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
          setPermissionError(true);
      } else {
          // Allow manual trigger if fetch fails generically
          alert("Could not load users. Check the 'Database Rules Help' button.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (pin === ADMIN_PIN) {
          setIsAuthenticated(true);
      } else {
          alert("Invalid PIN");
      }
  };

  const handleEditClick = (user: User) => {
      setEditingUser(user);
      // Pre-fill form with calculated days so admin sees current status
      setEditForm({
          shopName: user.shopName,
          phone: user.phone || '',
          subscriptionStatus: user.subscriptionStatus || 'trial',
          daysRemaining: calculateDaysRemaining(user)
      });
  };

  const handleSaveEdit = async () => {
      if (!editingUser) return;
      
      try {
          // Calculate new expiry date based on inputted days
          const now = new Date();
          const futureDate = new Date(now);
          futureDate.setDate(now.getDate() + Number(editForm.daysRemaining));
          
          const userRef = doc(db, "users", editingUser.uid);
          await updateDoc(userRef, {
              shopName: editForm.shopName,
              phone: editForm.phone,
              subscriptionStatus: editForm.subscriptionStatus,
              subscriptionExpiryDate: futureDate.toISOString() // Save as DATE, not number
          });
          
          // Refresh list to see updates
          fetchUsers();
          
          setEditingUser(null);
      } catch (error: any) {
          console.error("Error updating user:", error);
          if (error.code === 'permission-denied') {
              setPermissionError(true);
          } else {
              alert("Failed to update user.");
          }
      }
  };

  const updateUserStatus = async (user: User, newStatus: 'active' | 'expired' | 'suspended' | 'trial') => {
      if (!window.confirm(`Change status of "${user.shopName}" to ${newStatus.toUpperCase()}?`)) return;

      try {
          const userRef = doc(db, "users", user.uid);
          
          const updatePayload: any = { subscriptionStatus: newStatus };
          
          // If setting to active, maybe give default 30 days if expired? 
          // Or if setting to expired, set date to yesterday?
          // For now, just changing status is safer, let days remain as is unless edited.
          if (newStatus === 'expired') {
             // Force expiry date to past
             const past = new Date();
             past.setDate(past.getDate() - 1);
             updatePayload.subscriptionExpiryDate = past.toISOString();
          }

          await updateDoc(userRef, updatePayload);
          
          fetchUsers(); // Refresh list
      } catch (error: any) {
          console.error("Error updating status:", error);
          if (error.code === 'permission-denied') {
             setPermissionError(true); 
          } else {
             alert("Failed to update status. " + error.message);
          }
      }
  };

  const deleteUser = async (user: User) => {
      if (!window.confirm(`Are you sure you want to DELETE "${user.shopName}"? This cannot be undone.`)) return;

      try {
          await deleteDoc(doc(db, "users", user.uid));
          setUsers(users.filter(u => u.uid !== user.uid));
      } catch (error: any) {
           console.error("Error deleting user:", error);
           if (error.code === 'permission-denied') {
             setPermissionError(true);
           } else {
             alert("Failed to delete user. " + error.message);
           }
      }
  }

  const copyRules = () => {
      const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    /* Allow anyone logged in to read/write all users (Required for Admin Panel to work) */
    match /users/{userId} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null;
    }
    /* Orders stay private to the user */
    match /orders/{orderId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}`;
      navigator.clipboard.writeText(rules);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(u => 
      u.shopName.toLowerCase().includes(search.toLowerCase()) || 
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Stats
  const totalUsers = users.length;
  const activePro = users.filter(u => u.subscriptionStatus === 'active').length;
  const expired = users.filter(u => u.subscriptionStatus === 'expired').length;

  // Case 1: Not Logged in to Firebase
  if (!isFirebaseLoggedIn) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
              <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center">
                  <div className="flex justify-center mb-4">
                      <div className="bg-gray-100 p-3 rounded-full">
                          <LogIn className="h-8 w-8 text-gray-600" />
                      </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                  <p className="text-sm text-gray-500 mb-6">
                      To access the Admin Panel, you must be logged in to an account.
                  </p>
                  
                  <button 
                      onClick={() => onNavigate('login')}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mb-3"
                  >
                      Go to Login
                  </button>
                  <button onClick={onExit} className="w-full text-gray-500 text-sm hover:text-gray-700">
                      Back to Site
                  </button>
              </div>
        </div>
    );
  }

  // Case 2: Logged in, asking for PIN
  if (!isAuthenticated) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                  <div className="flex justify-center mb-4">
                      <div className="bg-green-100 p-3 rounded-full">
                          <Shield className="h-8 w-8 text-green-600" />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Super Admin</h2>
                  <form onSubmit={handleLogin}>
                      <input 
                          type="password" 
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest mb-4 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter PIN"
                          autoFocus
                      />
                      <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                          Unlock Dashboard
                      </button>
                  </form>
                  <button onClick={onExit} className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700">
                      Back to Site
                  </button>
              </div>
          </div>
      );
  }

  // Case 3: Permission Error
  if (permissionError) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
              <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                      <h1 className="text-2xl font-bold text-gray-900">Database Rules Update Required</h1>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                      To allow the Admin Panel to edit other users, you must paste the following security rules into Firebase.
                  </p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                      <ol className="list-decimal list-inside text-orange-800 space-y-2 text-sm">
                          <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Firebase Console</a></li>
                          <li>Go to <strong>Firestore Database</strong> &gt; <strong>Rules</strong> tab.</li>
                          <li>Delete current rules and paste the code below:</li>
                      </ol>
                  </div>

                  <div className="relative group mb-6">
                      <div className="absolute right-2 top-2">
                          <button 
                              onClick={copyRules}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 rounded-md text-xs font-bold shadow-sm transition-all"
                          >
                              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              {copied ? 'Copied!' : 'Copy Code'}
                          </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}`}
                      </pre>
                  </div>

                  <div className="flex gap-4">
                      <button 
                          onClick={() => window.location.reload()} 
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg"
                      >
                          I've Updated the Rules, Retry
                      </button>
                      <button 
                          onClick={onExit} 
                          className="px-6 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50 text-gray-700"
                      >
                          Exit
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Case 4: Dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <p className="text-sm text-gray-500 font-medium uppercase">Total Users</p>
                     <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <p className="text-sm text-gray-500 font-medium uppercase">Active Pro Users</p>
                     <p className="text-3xl font-bold text-green-600 mt-2">{activePro}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <p className="text-sm text-gray-500 font-medium uppercase">Expired / Trial</p>
                     <p className="text-3xl font-bold text-yellow-600 mt-2">{expired}</p>
                 </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center">
                    <button onClick={onExit} className="mr-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                        onClick={() => setPermissionError(true)} 
                        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition-colors"
                    >
                        <Database className="h-4 w-4" />
                        Database Rules Help
                   </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by Shop Name or Email..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchUsers} className="p-2 text-gray-500 hover:text-green-600" title="Refresh">
                        <Loader className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((u) => (
                                <tr key={u.uid} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-gray-900">{u.shopName}</span>
                                            <span className="text-sm text-gray-500">{u.email}</span>
                                            <span className="text-xs text-gray-400 font-mono mt-1">ID: {u.uid.slice(0, 8)}...</span>
                                            {u.phone && <span className="text-xs text-gray-500 mt-1">Tel: {u.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                {u.subscriptionStatus === 'active' && (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                                                        Active Pro
                                                    </span>
                                                )}
                                                {u.subscriptionStatus === 'trial' && (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                        Trial
                                                    </span>
                                                )}
                                                {(u.subscriptionStatus === 'expired' || !u.subscriptionStatus) && (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                        Expired
                                                    </span>
                                                )}
                                                {u.subscriptionStatus === 'suspended' && (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                                                        Suspended
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400">{u.daysRemaining} days left</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            {/* Edit Button */}
                                            <button 
                                                onClick={() => handleEditClick(u)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                                                title="Edit Details"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>

                                            {/* Status Toggles */}
                                            {u.subscriptionStatus !== 'active' && (
                                                <button 
                                                    onClick={() => updateUserStatus(u, 'active')}
                                                    className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"
                                                    title="Grant Lifetime Pro"
                                                >
                                                    <Crown className="h-4 w-4" />
                                                </button>
                                            )}
                                            
                                            {u.subscriptionStatus === 'active' && (
                                                <button 
                                                    onClick={() => updateUserStatus(u, 'expired')}
                                                    className="p-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200"
                                                    title="Revoke Pro (Expire)"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                            )}

                                            {u.subscriptionStatus !== 'suspended' ? (
                                                <button 
                                                    onClick={() => updateUserStatus(u, 'suspended')}
                                                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200"
                                                    title="Suspend User (Block Access)"
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                 <button 
                                                    onClick={() => updateUserStatus(u, 'trial')}
                                                    className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
                                                    title="Unsuspend (Reset to Trial)"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => deleteUser(u)}
                                                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-600 hover:text-white border border-gray-200 transition-colors ml-2"
                                                title="Delete User Data"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingUser(null)}></div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                    <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-bold text-gray-900">Edit User Details</h3>
                                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email (Read Only)</label>
                                    <input 
                                        type="text" 
                                        value={editingUser.email} 
                                        disabled 
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500" 
                                    />
                                    <p className="text-xs text-red-500 mt-1">Cannot change email/password from here.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Shop Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.shopName}
                                        onChange={(e) => setEditForm({...editForm, shopName: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                    <input 
                                        type="text" 
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500" 
                                        placeholder="No phone set"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Subscription Status</label>
                                        <select 
                                            value={editForm.subscriptionStatus}
                                            onChange={(e) => setEditForm({...editForm, subscriptionStatus: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                        >
                                            <option value="trial">Trial</option>
                                            <option value="active">Active Pro</option>
                                            <option value="expired">Expired</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Days Remaining (Calculated from today)</label>
                                        <input 
                                            type="number" 
                                            value={editForm.daysRemaining}
                                            onChange={(e) => setEditForm({...editForm, daysRemaining: parseInt(e.target.value) || 0})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500" 
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Saving this will set expiration to: {new Date(new Date().setDate(new Date().getDate() + Number(editForm.daysRemaining))).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;