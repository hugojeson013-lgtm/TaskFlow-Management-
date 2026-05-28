import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  CheckCircle, Circle, Clock, AlertCircle, Calendar, Plus, 
  MoreVertical, Search, Filter, LayoutDashboard, User as UserIcon, 
  Settings, LogOut, Check, ChevronDown, Bell, Lock, 
  Shield, Mail, Eye, EyeOff, Camera, Upload, Trash2, RefreshCw, Menu,
  Edit2, X
} from 'lucide-react';
import Chatbot from './components/Chatbot';
import stickyNotesBg from './assets/sticky_notes.png';


const API_URL = 'http://localhost:8000/api';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const calculateOverdueTasks = (tasks) => {
  const now = new Date();
  return tasks.filter(t => {
    if (t.status === 'Done') return false;
    const [year, month, day] = t.deadline.split('-').map(Number);
    let hours = 12;
    let minutes = 0;
    if (t.due_time) {
      const [h, m] = t.due_time.split(':').map(Number);
      hours = h;
      minutes = m;
    }
    const deadlineDate = new Date(year, month - 1, day, hours, minutes);
    return deadlineDate < now;
  });
};

export default function App() {
  const [currentView, setCurrentView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSetView = (view) => {
    setCurrentView(view);
    localStorage.setItem('taskflow_view', view);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedUser = localStorage.getItem('taskflow_user');
    const savedView = localStorage.getItem('taskflow_view');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView(savedView || 'dashboard');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('taskflow_user', JSON.stringify(userData));
    const savedView = localStorage.getItem('taskflow_view');
    setCurrentView(savedView || 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_view');
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      {currentView === 'login' && (
        <LoginView 
          onLogin={handleLogin} 
          onGoToSignup={() => setCurrentView('signup')} 
          successMessage={successMessage}
          setSuccessMessage={setSuccessMessage}
          onNeedsVerification={(email) => {
            setVerificationEmail(email);
            setCurrentView('verify');
          }}
          onNeeds2FA={(email) => {
            setVerificationEmail(email);
            setCurrentView('2fa');
          }}
        />
      )}
      {currentView === 'signup' && (
        <SignupView 
          onSignupComplete={(email) => {
            setVerificationEmail(email);
            setCurrentView('verify');
          }} 
          onGoToLogin={() => setCurrentView('login')} 
        />
      )}
      {currentView === 'verify' && (
        <VerificationView 
          email={verificationEmail} 
          onVerificationSuccess={handleLogin} 
          onGoToLogin={() => setCurrentView('login')}
        />
      )}
      {currentView === '2fa' && (
        <VerificationView 
          email={verificationEmail} 
          onVerificationSuccess={handleLogin} 
          onGoToLogin={() => setCurrentView('login')}
          is2FA={true}
        />
      )}
      
      {['dashboard', 'profile', 'settings', 'monitor'].includes(currentView) && (
        <>
          <MainLayout 
            currentView={currentView} 
            setCurrentView={handleSetView} 
            onLogout={handleLogout}
            user={user}
          >
            {currentView === 'dashboard' && <DashboardView user={user} />}
            {currentView === 'profile' && <ProfileView user={user} onUserUpdate={handleUserUpdate} />}
            {currentView === 'settings' && <SettingsView user={user} onUserUpdate={handleUserUpdate} />}
            {currentView === 'monitor' && <AdminMonitorView />}
          </MainLayout>
          <Chatbot user={user} />
        </>
      )}
    </div>
  );
}

function MainLayout({ children, currentView, setCurrentView, onLogout, user }) {
  const [menuVisible, setMenuVisible] = useState(true);
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(user?.is_staff || user?.is_superuser ? [{ id: 'monitor', label: 'Admin Monitor', icon: Shield }] : []),
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Brand Header */}
      <header className="h-16 flex items-center justify-between px-0 border-b border-red-100/50 bg-white" style={{ background: 'linear-gradient(to right, #fee2e2, #d1fae5)' }}>
        <div 
          className={`h-full flex items-center transition-all duration-300 ease-in-out border-r border-red-100/50 ${
            menuVisible ? 'w-64 px-6 justify-between' : 'w-20 justify-center'
          }`}
        >
          {menuVisible && (
            <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl tracking-tight animate-in fade-in duration-300">
              <CheckCircle className="w-8 h-8" />
              <span>TaskFlow</span>
            </div>
          )}
          <button 
            onClick={() => setMenuVisible(!menuVisible)} 
            className="p-1.5 hover:bg-black/5 rounded-lg text-slate-700 transition-colors"
            title={menuVisible ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 px-6">
          {/* Header empty space */}
        </div>
      </header>

      {/* Content Area underneath the header */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside 
          className={`flex flex-col justify-between border-r border-red-100/50 transition-all duration-300 ease-in-out bg-white ${
            menuVisible ? 'absolute z-50 h-[calc(100vh-64px)] w-64 md:relative md:h-auto md:flex' : 'hidden md:flex w-20'
          }`} 
          style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #d1fae5 100%)' }}
        >
          <div className="p-4">
            <nav className="space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-blue-600 text-white font-medium shadow-sm' 
                        : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                    }`}
                    title={!menuVisible ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span 
                      className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                        menuVisible ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* User profile details at the bottom */}
          <div className="p-4 border-t border-red-200/45">
            <div className="flex items-center gap-3 mb-6 overflow-hidden">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200/50 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200/50 flex-shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div 
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  menuVisible ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
                }`}
              >
                <p className="text-sm font-medium text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-600 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 rounded-lg transition-colors border border-red-200/30`}
              title={!menuVisible ? "Log Out" : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span 
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  menuVisible ? 'opacity-100 max-w-[100px]' : 'opacity-0 max-w-0'
                }`}
              >
                Log Out
              </span>
            </button>
          </div>
        </aside>

        {/* Dashboard Main Content area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #f0fdf4 100%)' }}>
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
             <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
              <CheckCircle className="w-6 h-6" />
              <span>TaskFlow</span>
            </div>
            <button onClick={() => setMenuVisible(!menuVisible)} className="p-2 text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardView({ user }) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all'); 
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = getTodayDate();
  
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, taskRes] = await Promise.all([
        axios.get(`${API_URL}/categories/`),
        axios.get(`${API_URL}/tasks/?userId=${user?.id || ''}`)
      ]);
      
      // If there are no categories, let's create a default one for the user so they can add tasks
      let loadedCategories = catRes.data;
      if (loadedCategories.length === 0) {
        const defaultCat = await axios.post(`${API_URL}/categories/`, { name: 'General', color: 'bg-blue-100 text-blue-700' });
        loadedCategories = [defaultCat.data];
      }
      
      setCategories(loadedCategories);
      setTasks(taskRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const overdueTasks = useMemo(() => calculateOverdueTasks(tasks), [tasks]);
  
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter === 'today') {
      result = tasks.filter(t => t.deadline === today && t.status !== 'Done');
    } else if (filter === 'upcoming') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      result = tasks.filter(t => t.deadline === tomorrowStr && t.status !== 'Done');
    } else if (filter === 'overdue') {
      result = overdueTasks;
    }
    
    if (selectedCategoryId) {
      result = result.filter(t => t.category === selectedCategoryId);
    }
    
    return result.sort((a, b) => {
      if (a.deadline === b.deadline) {
        const priorityScore = { High: 3, Medium: 2, Low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }, [tasks, filter, overdueTasks, today, selectedCategoryId]);

  const addTask = async (newTaskData) => {
    try {
      const res = await axios.post(`${API_URL}/tasks/`, {
        ...newTaskData,
        user: user.id
      });
      setTasks([...tasks, res.data]);
      setTaskModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create task. Please check your inputs.');
    }
  };

  const updateTask = async (taskId, updatedTaskData) => {
    try {
      const res = await axios.patch(`${API_URL}/tasks/${taskId}/`, {
        ...updatedTaskData,
        user: user.id
      });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
      setEditingTask(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update task. Please check your inputs.');
    }
  };

  const addCategory = async (newCategoryData) => {
    try {
      const res = await axios.post(`${API_URL}/categories/`, newCategoryData);
      setCategories([...categories, res.data]);
      setCategoryModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create category. Please check your inputs.');
    }
  };

  const deleteCategory = async (catId: number) => {
    const catName = categories.find(c => c.id === catId)?.name || 'Category';
    if (!window.confirm(`Are you sure you want to delete category "${catName}"? This will also delete all tasks in this category.`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/categories/${catId}/`);
      setCategories(categories.filter(c => c.id !== catId));
      setTasks(tasks.filter(t => t.category !== catId));
      setSelectedCategoryId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/`, { status: newStatus });
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(previousTasks);
      alert('Failed to update task status.');
    }
  };
  
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}/`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete task.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-slate-500">Loading dashboard...</p></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200">{error}</div>}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your categories and tasks efficiently.</p>
        </div>
        <button 
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Tasks" value={tasks.length} icon={LayoutDashboard} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard title="Completed" value={tasks.filter(t => t.status === 'Done').length} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard title="Due Today" value={tasks.filter(t => t.deadline === today && t.status !== 'Done').length} icon={Calendar} color="text-amber-600" bg="bg-amber-50" />
        <MetricCard title="Overdue" value={overdueTasks.length} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* Categories Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Filter by Category</h3>
          <button 
            onClick={() => setCategoryModalOpen(true)}
            className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => {
            const isSelected = selectedCategoryId === cat.id;
            // Build hover classes from the category color for non-selected state
            const getHoverClasses = (colorClass: string) => {
              const map: Record<string, string> = {
                'bg-blue-100 text-blue-700': 'hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300',
                'bg-emerald-100 text-emerald-700': 'hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300',
                'bg-rose-100 text-rose-700': 'hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300',
                'bg-purple-100 text-purple-700': 'hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300',
                'bg-amber-100 text-amber-700': 'hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300',
                'bg-pink-100 text-pink-700': 'hover:bg-pink-100 hover:text-pink-700 hover:border-pink-300',
                'bg-indigo-100 text-indigo-700': 'hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300',
              };
              return map[colorClass] || 'hover:bg-slate-50';
            };
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected 
                    ? `ring-2 ring-blue-500 border-transparent shadow-sm ${cat.color}` 
                    : `border-slate-200/50 bg-white text-slate-700 ${getHoverClasses(cat.color)}`
                }`}
              >
                {cat.name}
              </button>
            );
          })}
          {selectedCategoryId && (
            <>
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all animate-in fade-in duration-200"
                title="Clear active category filter"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filter
              </button>
              <button
                onClick={() => deleteCategory(selectedCategoryId)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all animate-in fade-in duration-200"
                title="Delete this category"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Category
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Tasks</FilterButton>
            <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>Today</FilterButton>
            <FilterButton active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>Upcoming</FilterButton>
            <FilterButton active={filter === 'overdue'} onClick={() => setFilter('overdue')}>Overdue</FilterButton>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No tasks found for this view.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                category={categories.find(c => c.id === task.category)} 
                onStatusChange={(status) => updateTaskStatus(task.id, status)} 
                onDelete={() => deleteTask(task.id)}
                onEdit={() => setEditingTask(task)}
                isOverdue={overdueTasks.some(o => o.id === task.id)}
                onCategoryClick={(catId) => setSelectedCategoryId(catId)}
              />
            ))
          )}
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskModal 
          onClose={() => setTaskModalOpen(false)} 
          onSave={addTask} 
          categories={categories} 
        />
      )}

      {isCategoryModalOpen && (
        <CategoryModal 
          onClose={() => setCategoryModalOpen(false)} 
          onSave={addCategory} 
        />
      )}

      {editingTask && (
        <TaskModal 
          onClose={() => setEditingTask(null)} 
          onSave={(updatedData) => updateTask(editingTask.id, updatedData)} 
          categories={categories} 
          task={editingTask}
        />
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-slate-900 text-white shadow-sm' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function TaskRow({ task, category, onStatusChange, onDelete, onEdit, isOverdue, onCategoryClick }) {
  const priorityColors = {
    High: 'bg-rose-50 text-rose-700 border-rose-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const statusIcons = {
    'To Do': <Circle className="w-5 h-5 text-slate-300" />,
    'In Progress': <Clock className="w-5 h-5 text-blue-500" />,
    'Done': <CheckCircle className="w-5 h-5 text-emerald-500" />
  };

  // Map category color theme to row container styles
  let rowStyles = 'bg-white hover:bg-slate-50 border-l-4 border-slate-200';
  if (isOverdue) {
    rowStyles = 'bg-rose-50/60 hover:bg-rose-100/40 border-l-4 border-rose-500';
  } else if (category) {
    const colorClass = category.color;
    if (colorClass.includes('bg-blue-100')) {
      rowStyles = 'bg-blue-50/20 hover:bg-blue-50/40 border-l-4 border-blue-500/60';
    } else if (colorClass.includes('bg-emerald-100')) {
      rowStyles = 'bg-emerald-50/20 hover:bg-emerald-50/40 border-l-4 border-emerald-500/60';
    } else if (colorClass.includes('bg-rose-100')) {
      rowStyles = 'bg-rose-50/20 hover:bg-rose-50/40 border-l-4 border-rose-500/60';
    } else if (colorClass.includes('bg-purple-100')) {
      rowStyles = 'bg-purple-50/20 hover:bg-purple-50/40 border-l-4 border-purple-500/60';
    } else if (colorClass.includes('bg-amber-100')) {
      rowStyles = 'bg-amber-50/20 hover:bg-amber-50/40 border-l-4 border-amber-500/60';
    } else if (colorClass.includes('bg-pink-100')) {
      rowStyles = 'bg-pink-50/20 hover:bg-pink-50/40 border-l-4 border-pink-500/60';
    } else if (colorClass.includes('bg-indigo-100')) {
      rowStyles = 'bg-indigo-50/20 hover:bg-indigo-50/40 border-l-4 border-indigo-500/60';
    }
  }

  return (
    <div className={`p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${rowStyles} ${task.status === 'Done' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <button 
          className="mt-1 flex-shrink-0"
          onClick={() => onStatusChange(task.status === 'Done' ? 'To Do' : 'Done')}
        >
          {statusIcons[task.status]}
        </button>
        <div>
          <h3 className={`font-medium text-slate-900 ${task.status === 'Done' ? 'line-through text-slate-500' : ''}`}>
            {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-medium">
            {category && (
              <button 
                onClick={() => onCategoryClick && onCategoryClick(category.id)}
                className={`px-2 py-0.5 rounded-md hover:opacity-85 transition-opacity ${category.color}`}
              >
                {category.name}
              </button>
            )}
            <span className={`px-2 py-0.5 rounded-md border ${priorityColors[task.priority]}`}>
              {task.priority} Priority
            </span>
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {task.due_time ? (() => {
                try {
                  const [hourStr, minuteStr] = task.due_time.split(':');
                  const hour = parseInt(hourStr, 10);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour % 12 || 12;
                  return ` at ${displayHour}:${minuteStr} ${ampm}`;
                } catch {
                  return ` at ${task.due_time.substring(0, 5)}`;
                }
              })() : ''}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 pl-9 md:pl-0">
        <select 
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-sm bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
           Edit
        </button>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors">
           Delete
        </button>
      </div>
    </div>
  );
}

function TaskModal({ onClose, onSave, categories, task }) {
  const [title, setTitle] = useState(task ? task.title : '');
  const [category, setCategory] = useState(task ? task.category : (categories[0]?.id || ''));
  const [priority, setPriority] = useState(task ? task.priority : 'Medium');
  const [deadline, setDeadline] = useState(task ? task.deadline : getTodayDate());
  const [dueTime, setDueTime] = useState(task && task.due_time ? task.due_time.substring(0, 5) : '12:00');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!deadline) {
      setError('Deadline is required');
      return;
    }
    
    if (!task && new Date(deadline) < new Date(getTodayDate())) {
      const confirmPast = window.confirm("The deadline is in the past. Create as an overdue task?");
      if(!confirmPast) return;
    }

    onSave({ title, category, priority, deadline, due_time: dueTime + ':00' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-rose-600 text-sm bg-rose-50 p-2 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="E.g., Update database schema"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline Date</label>
              <input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deadline Time (PH Timezone)</label>
            <input 
              type="time" 
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('bg-blue-100 text-blue-700');
  const [error, setError] = useState('');

  const colorPresets = [
    { name: 'Blue', class: 'bg-blue-100 text-blue-700' },
    { name: 'Green', class: 'bg-emerald-100 text-emerald-700' },
    { name: 'Red', class: 'bg-rose-100 text-rose-700' },
    { name: 'Purple', class: 'bg-purple-100 text-purple-700' },
    { name: 'Amber', class: 'bg-amber-100 text-amber-700' },
    { name: 'Pink', class: 'bg-pink-100 text-pink-700' },
    { name: 'Indigo', class: 'bg-indigo-100 text-indigo-700' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    onSave({ name: name.trim(), color });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Create New Category</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-rose-600 text-sm bg-rose-50 p-2 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="E.g., Work, Personal, Shopping"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map(preset => (
                <button
                  key={preset.class}
                  type="button"
                  onClick={() => setColor(preset.class)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    color === preset.class 
                      ? 'ring-2 ring-blue-500 border-transparent shadow-sm scale-105' 
                      : 'border-slate-100 hover:bg-slate-50'
                  } ${preset.class}`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProfileViewProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
}

function ProfileView({ user, onUserUpdate }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<string | number>('');
  const [occupation, setOccupation] = useState('');
  const [cityAddress, setCityAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const [tempImageSrc, setTempImageSrc] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state with user prop when it updates or when we start editing
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setMiddleName(user.middle_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setAge(user.age ?? '');
      setOccupation(user.occupation || '');
      setCityAddress(user.city_address || '');
      setProfilePicture(user.profile_picture || '');
    }
  }, [user, isEditing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTempImageSrc(reader.result);
          setShowCropper(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First Name and Last Name are required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await axios.patch(`${API_URL}/users/${user.id}/`, {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email: email,
        age: age !== '' ? parseInt(age as string, 10) : null,
        occupation: occupation,
        city_address: cityAddress,
        profile_picture: profilePicture
      });
      onUserUpdate(res.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data) {
        setError(Object.values(err.response.data).flat().join(', '));
      } else {
        setError('Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner header */}
        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #d1fae5 100%)' }} />
        
        <div className="px-6 pb-6 relative">
          {error && (
            <div className="mt-4 bg-rose-50 text-rose-700 p-3.5 rounded-xl text-sm border border-rose-100">
              {error}
            </div>
          )}

          {/* Profile Picture Overlay */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 mb-6">
            <div className="flex items-end gap-4">
              <div 
                onClick={triggerFileSelect}
                className={`relative rounded-full border-4 border-white shadow-md bg-white overflow-hidden w-32 h-32 ${isEditing ? 'cursor-pointer group' : ''}`}
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 text-4xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-8 h-8" />
                    <span className="text-[10px] font-semibold mt-1">Change Photo</span>
                  </div>
                )}
              </div>
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'User'}</h1>
                <p className="text-sm text-slate-500">@{user?.username || 'username'}</p>
              </div>
            </div>

            {/* Edit / Save Actions */}
            <div className="mb-2">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => { e.currentTarget.value = ''; }}
          />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-100 pt-6">
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Name</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.first_name || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Middle Name</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.middle_name || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Name</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.last_name || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
              {isEditing ? (
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.email || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age</p>
              {isEditing ? (
                <input 
                  type="number"
                  min="0"
                  max="150"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.age ? `${user.age} years old` : 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupation</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.occupation || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">City Address</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={cityAddress}
                  onChange={(e) => setCityAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                />
              ) : (
                <p className="text-base font-medium text-slate-800">{user?.city_address || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCropper && (
        <ImageCropper 
          src={tempImageSrc} 
          onCrop={(croppedImg: string) => {
            setProfilePicture(croppedImg);
            setShowCropper(false);
          }}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-base font-medium text-slate-800">{value || 'Not provided'}</p>
    </div>
  );
}

interface SettingsViewProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
}

function SettingsView({ user, onUserUpdate }: SettingsViewProps) {
  // Username state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Password state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toggle states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(false);

  // Sync state with user prop
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setTwoFactorEnabled(user.two_factor_enabled || false);
      setTaskRemindersEnabled(user.task_reminders_enabled || false);
    }
  }, [user]);

  const handleUsernameSave = async () => {
    if (!username.trim()) {
      setUsernameError('Username cannot be empty.');
      return;
    }
    try {
      setUsernameLoading(true);
      setUsernameError('');
      const res = await axios.patch(`${API_URL}/users/${user.id}/`, {
        username: username.trim(),
      });
      onUserUpdate(res.data);
      setIsEditingUsername(false);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.username) {
        setUsernameError(err.response.data.username.join(', '));
      } else {
        setUsernameError('Failed to update username. It may be already taken.');
      }
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!newPassword) {
      setPasswordError('Password cannot be empty.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    try {
      setPasswordLoading(true);
      setPasswordError('');
      setPasswordSuccess('');
      const res = await axios.patch(`${API_URL}/users/${user.id}/`, {
        password: newPassword,
      });
      onUserUpdate(res.data);
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data) {
        setPasswordError(Object.values(err.response.data).flat().join(', '));
      } else {
        setPasswordError('Failed to update password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    const nextVal = !twoFactorEnabled;
    try {
      const res = await axios.patch(`${API_URL}/users/${user.id}/`, {
        two_factor_enabled: nextVal,
      });
      setTwoFactorEnabled(res.data.two_factor_enabled);
      onUserUpdate(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to update 2FA settings.');
    }
  };

  const handleTaskRemindersToggle = async () => {
    const nextVal = !taskRemindersEnabled;
    try {
      const res = await axios.patch(`${API_URL}/users/${user.id}/`, {
        task_reminders_enabled: nextVal,
      });
      setTaskRemindersEnabled(res.data.task_reminders_enabled);
      onUserUpdate(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to update email reminder settings.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account credentials, security preferences, and email notifications.</p>
      </div>

      <div className="space-y-6">
        {/* Account Info Settings Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Account Credentials
          </h2>

          {/* Edit Username Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-slate-700">Username</p>
              {isEditingUsername ? (
                <div className="space-y-2 max-w-md mt-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                      placeholder="Enter new username"
                    />
                    <button 
                      onClick={handleUsernameSave}
                      disabled={usernameLoading}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
                      title="Save Username"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setIsEditingUsername(false); setUsername(user?.username || ''); setUsernameError(''); }}
                      disabled={usernameLoading}
                      className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {usernameError && <p className="text-xs text-rose-600 font-medium">{usernameError}</p>}
                </div>
              ) : (
                <p className="text-sm text-slate-500">@{user?.username || 'username'}</p>
              )}
            </div>
            {!isEditingUsername && (
              <button 
                onClick={() => setIsEditingUsername(true)}
                className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                title="Edit Username"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Change Password Row */}
          <div className="py-2 border-t border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">Change Password</p>
                <p className="text-xs text-slate-400">Security check uses double-verification to prevent lockouts.</p>
              </div>
              {!isEditingPassword && (
                <button 
                  onClick={() => setIsEditingPassword(true)}
                  className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                  title="Change Password"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {passwordSuccess && (
              <div className="mt-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm border border-emerald-100 animate-in fade-in duration-300">
                {passwordSuccess}
              </div>
            )}

            {isEditingPassword && (
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
                {passwordError && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs border border-rose-100">
                    {passwordError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-800"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => { setIsEditingPassword(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                    disabled={passwordLoading}
                    className="flex items-center gap-1 px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-medium transition-colors text-xs disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button 
                    onClick={handlePasswordSave}
                    disabled={passwordLoading}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-xs shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {passwordLoading ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security & Notification Settings Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-emerald-600" />
            Security & Notifications
          </h2>

          {/* 2FA Toggle Row */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1 flex-1 pr-4">
              <p className="text-sm font-semibold text-slate-700">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-slate-400">Receive a 6-digit confirmation code via email when logging in.</p>
            </div>
            <button
              type="button"
              onClick={handleTwoFactorToggle}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Email Reminders Toggle Row */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div className="space-y-1 flex-1 pr-4">
              <p className="text-sm font-semibold text-slate-700">Deadline Alerts via Email</p>
              <p className="text-xs text-slate-400">Receive automated reminders when a task due date is near.</p>
            </div>
            <button
              type="button"
              onClick={handleTaskRemindersToggle}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                taskRemindersEnabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  taskRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminMonitorView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAutoPolling, setIsAutoPolling] = useState(true);

  const fetchUsers = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await axios.get(`${API_URL}/users/`);
      setUsers(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user list. Make sure backend is running.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  useEffect(() => {
    if (!isAutoPolling) return;
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPolling]);

  const handleToggleVerification = async (user) => {
    const updatedStatus = !user.email_verified;
    const prevUsers = [...users];
    setUsers(users.map(u => u.id === user.id ? { ...u, email_verified: updatedStatus } : u));
    
    try {
      await axios.patch(`${API_URL}/users/${user.id}/`, { email_verified: updatedStatus });
    } catch (err) {
      console.error(err);
      setUsers(prevUsers);
      alert('Failed to update email verification status.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/users/${userId}/`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.city_address?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filter === 'verified') return user.email_verified;
      if (filter === 'unverified') return !user.email_verified;
      if (filter === 'staff') return user.is_staff || user.is_superuser;
      
      return true;
    });
  }, [users, searchQuery, filter]);

  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter(u => u.email_verified).length;
    const unverified = total - verified;
    const admins = users.filter(u => u.is_staff || u.is_superuser).length;
    return { total, verified, unverified, admins };
  }, [users]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading user monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200">{error}</div>}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Monitor</h1>
          <p className="text-slate-500 mt-1">Real-time login, signup, and verification tracking.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm self-start">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isAutoPolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-sm font-medium text-slate-600">
              {isAutoPolling ? 'Live Monitoring Active' : 'Real-time Paused'}
            </span>
          </div>
          <button
            onClick={() => setIsAutoPolling(!isAutoPolling)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isAutoPolling 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isAutoPolling ? 'Pause' : 'Resume'}
          </button>
          <button 
            onClick={() => fetchUsers(true)} 
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Registrations" value={stats.total} icon={UserIcon} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard title="Verified Emails" value={stats.verified} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard title="Unverified Emails" value={stats.unverified} icon={AlertCircle} color="text-amber-600" bg="bg-amber-50" />
        <MetricCard title="Administrators" value={stats.admins} icon={Shield} color="text-indigo-600" bg="bg-indigo-50" />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search username, email, occupation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2 self-stretch md:self-auto overflow-x-auto min-w-max">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
            <FilterButton active={filter === 'verified'} onClick={() => setFilter('verified')}>Verified</FilterButton>
            <FilterButton active={filter === 'unverified'} onClick={() => setFilter('unverified')}>Unverified</FilterButton>
            <FilterButton active={filter === 'staff'} onClick={() => setFilter('staff')}>Staff/Admins</FilterButton>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">User</th>
                <th className="py-4 px-5">Email Status</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">Joined</th>
                <th className="py-4 px-5">Last Login</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserIcon className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    No users matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold border border-blue-100">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{user.username}</p>
                          <p className="text-xs text-slate-400">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        {user.email_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                            <Clock className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {user.is_superuser ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                          Superuser
                        </span>
                      ) : user.is_staff ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                          Staff
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          User
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-xs">
                      {user.date_joined ? new Date(user.date_joined).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-xs">
                      {user.last_login ? new Date(user.last_login).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleVerification(user)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            user.email_verified
                              ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {user.email_verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoginView({ onLogin, onGoToSignup, successMessage, setSuccessMessage, onNeedsVerification, onNeeds2FA }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/auth/login/`, { email, password });
      if (res.data?.needs_2fa) {
        onNeeds2FA(res.data.email);
      } else {
        onLogin(res.data);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.needs_verification) {
        onNeedsVerification(err.response.data.email);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${stickyNotesBg})` }}
    >
      <div className="absolute inset-0 bg-slate-50/85 backdrop-blur-[2px] z-0"></div>
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome back</h2>
        <p className="text-center text-slate-500 mb-8">Enter your details to access your tasks.</p>

        {successMessage && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-sm border border-emerald-100 flex justify-between items-center animate-in fade-in duration-300">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="font-bold hover:text-emerald-950">&times;</button>
          </div>
        )}

        {error && <div className="mb-4 bg-rose-50 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Don't have an account? <button onClick={onGoToSignup} className="text-blue-600 font-medium hover:underline">Sign up</button>
        </p>
      </div>
    </div>
  );
}

function SignupView({ onSignupComplete, onGoToLogin }: { onSignupComplete: (email: string) => void; onGoToLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cityAddress, setCityAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Crop states
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [showCropper, setShowCropper] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTempImageSrc(reader.result);
          setShowCropper(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/auth/signup/`, {
        username,
        email,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        age: age ? parseInt(age) : null,
        occupation,
        city_address: cityAddress,
        profile_picture: profilePicture,
        password
      });
      alert('Sign up successful! A verification code and link have been sent to your email.');
      onSignupComplete(email);
    } catch (err: any) {
      if (err.response?.data) {
        setError(Object.values(err.response.data).flat().join(', '));
      } else {
        setError('Signup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative py-12"
      style={{ backgroundImage: `url(${stickyNotesBg})` }}
    >
      <div className="absolute inset-0 bg-slate-50/85 backdrop-blur-[2px] z-0"></div>
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Create an account</h2>
        <p className="text-center text-slate-500 mb-8">Start managing your categories efficiently.</p>

        {error && <div className="mb-6 bg-rose-50 text-rose-700 p-3.5 rounded-xl text-sm border border-rose-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload & Crop */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-sm" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm group-hover:bg-blue-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500">Profile Picture (Click to upload/crop)</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
              onClick={(e: React.MouseEvent<HTMLInputElement>) => { e.currentTarget.value = ''; }}
            />
          </div>

          {/* Personal Info Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                <input 
                  type="text" 
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder=""
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input 
                  type="number" 
                  min="0"
                  max="150"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder=""
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                <input 
                  type="text" 
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City Address</label>
              <input 
                type="text" 
                value={cityAddress}
                onChange={(e) => setCityAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder=""
              />
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Account Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder=""
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Passwords */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder=""
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder=""
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 mt-4 text-sm"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account? <button onClick={onGoToLogin} className="text-blue-600 font-medium hover:underline">Log in</button>
        </p>
      </div>

      {showCropper && (
        <ImageCropper 
          src={tempImageSrc} 
          onCrop={(croppedImg: string) => {
            setProfilePicture(croppedImg);
            setShowCropper(false);
          }}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}

interface ImageCropperProps {
  src: string;
  onCrop: (img: string) => void;
  onCancel: () => void;
}

function ImageCropper({ src, onCrop, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imgRef.current;
    if (!img) return;

    canvas.width = 200;
    canvas.height = 200;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const cropX = (rect.width - 200) / 2;
    const cropY = (rect.height - 200) / 2;

    const imgX = (rect.width - img.width * zoom) / 2 + position.x;
    const imgY = (rect.height - img.height * zoom) / 2 + position.y;

    const dx = cropX - imgX;
    const dy = cropY - imgY;

    const scaleX = imgWidth / (img.width * zoom);
    const scaleY = imgHeight / (img.height * zoom);

    const sx = dx * scaleX;
    const sy = dy * scaleY;
    const sWidth = 200 * scaleX;
    const sHeight = 200 * scaleY;

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 200, 200);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCrop(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">Crop Profile Picture</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>
        <div className="p-6 flex flex-col items-center gap-6">
          <div 
            ref={containerRef}
            className="w-[200px] h-[200px] rounded-full border-2 border-dashed border-blue-500 overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-100 flex items-center justify-center select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt="To Crop"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease',
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
            <div className="absolute inset-0 pointer-events-none border-[10px] border-slate-900/30 rounded-full" />
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="text-center text-xs text-slate-400 mt-2">Drag image inside circle to position.</p>
          </div>

          <div className="flex gap-3 w-full pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleCrop}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Crop & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VerificationViewProps {
  email: string;
  onVerificationSuccess: (user: any) => void;
  onGoToLogin: () => void;
  is2FA?: boolean;
}

function VerificationView({ email, onVerificationSuccess, onGoToLogin, is2FA = false }: VerificationViewProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/auth/verify/`, { email, code });
      setSuccess('Verification successful! Logging you in...');
      setTimeout(() => {
        onVerificationSuccess(res.data);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError('');
      setSuccess('');
      await axios.post(`${API_URL}/auth/resend-code/`, { email });
      setSuccess('A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          {is2FA ? 'Two-Factor Authentication' : 'Verify Your Email'}
        </h2>
        <p className="text-center text-slate-500 text-sm mb-6">
          We have sent a {is2FA ? '2FA code' : 'verification code'} to <span className="font-semibold text-slate-800">{email || 'your email'}</span>. Please enter the 6-digit code below to {is2FA ? 'complete your login' : 'activate your account'}.
        </p>

        {success && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm border border-emerald-100">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-rose-50 text-rose-700 p-3 rounded-xl text-sm border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center text-lg font-bold tracking-widest"
                placeholder="000000"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || resending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : (is2FA ? 'Verify & Sign In' : 'Verify & Log In')}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm">
          <button 
            onClick={handleResend}
            disabled={loading || resending}
            className="text-blue-600 font-medium hover:underline disabled:opacity-50"
          >
            {resending ? 'Resending Code...' : 'Resend Verification Code'}
          </button>
          
          <button 
            onClick={onGoToLogin}
            className="text-slate-500 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
