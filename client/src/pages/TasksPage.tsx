import { useEffect, useState } from 'react';
import { taskAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types';
import { Plus, Search, MoreVertical, Calendar, Clock, X, ChevronDown, ListTodo, CheckCircle2, AlertTriangle, Flame, Zap, Circle, Briefcase, Users, FileText, Network } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'application', label: 'Application' },
  { value: 'interview', label: 'Interview' },
  { value: 'skill', label: 'Skill' },
  { value: 'network', label: 'Networking' },
  { value: 'resume', label: 'Resume' }
];

interface FormData {
  title: string; description: string; status: string; priority: string;
  category: string; dueDate: string; estimatedHours: string; tags: string[];
}

const initialFormData: FormData = {
  title: '', description: '', status: 'backlog', priority: 'medium',
  category: 'general', dueDate: '', estimatedHours: '', tags: []
};

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-slate-400 bg-slate-500/20', medium: 'text-blue-400 bg-blue-500/20',
    high: 'text-amber-400 bg-amber-500/20', urgent: 'text-red-400 bg-red-500/20'
  };
  return colors[priority] || 'text-slate-400 bg-slate-500/20';
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'urgent': return <Flame className="w-4 h-4 text-red-400" />;
    case 'high': return <Zap className="w-4 h-4 text-amber-400" />;
    case 'medium': return <AlertTriangle className="w-4 h-4 text-blue-400" />;
    default: return <Circle className="w-4 h-4 text-slate-400" />;
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'application': return <Briefcase className="w-4 h-4" />;
    case 'interview': return <Users className="w-4 h-4" />;
    case 'skill': return <Zap className="w-4 h-4" />;
    case 'network': return <Network className="w-4 h-4" />;
    case 'resume': return <FileText className="w-4 h-4" />;
    default: return <ListTodo className="w-4 h-4" />;
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    backlog: 'bg-slate-500/20 text-slate-300', todo: 'bg-blue-500/20 text-blue-300',
    'in-progress': 'bg-cyan-500/20 text-cyan-300', review: 'bg-amber-500/20 text-amber-300',
    done: 'bg-emerald-500/20 text-emerald-300'
  };
  return colors[status] || 'bg-slate-500/20 text-slate-300';
}

function formatStatus(status: string): string {
  const names: Record<string, string> = {
    backlog: 'Backlog', todo: 'To Do', 'in-progress': 'In Progress',
    review: 'Review', done: 'Done'
  };
  return names[status] || status;
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => { if (user) fetchTasks(); }, [user]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await taskAPI.getAll();
      setTasks(res.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setLoading(false);
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      if (editingId) {
        await taskAPI.update(editingId, data);
      } else {
        await taskAPI.create(data);
      }
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
    closeModal();
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title, description: task.description || '', status: task.status,
      priority: task.priority, category: task.category,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours?.toString() || '',
      tags: task.tags || []
    });
    setEditingId(task._id);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.delete(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
    setOpenMenuId(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await taskAPI.update(id, { status });
      setTasks(tasks.map(t => t._id === id ? { ...t, status: status as any } : t));
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      return isBefore(new Date(t.dueDate), startOfDay(new Date()));
    }).length,
    highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length
  };

  const groupedTasks = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status.value] = filteredTasks.filter(t => t.status === status.value);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Manager</h1>
          <p className="text-slate-400 mt-1">Organize and track your career tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>List</button>
            <button onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Board</button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-400 hover:to-blue-500 transition-all">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: ListTodo, color: 'text-cyan-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'High Priority', value: stats.highPriority, icon: Flame, color: 'text-amber-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Search tasks..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-10">
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-10">
              <option value="all">All Priority</option>
              {PRIORITY_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 border border-slate-700 rounded-xl">
            <ListTodo className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No tasks found</h3>
            <p className="text-slate-400">{searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first task to get started'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date())) && task.status !== 'done';
              return (
                <div key={task._id} className={`bg-slate-800/50 border rounded-xl p-4 hover:border-slate-600 transition-colors ${isOverdue ? 'border-red-500/50' : 'border-slate-700'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <button onClick={() => handleStatusChange(task._id, task.status === 'done' ? 'todo' : 'done')}
                        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-cyan-400'}`}>
                        {task.status === 'done' && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        </div>
                        {task.description && <p className="text-sm text-slate-400 mt-1">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            {getCategoryIcon(task.category)}
                            <span className="capitalize">{task.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>{formatStatus(task.status)}</span>
                          {task.dueDate && (
                            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              {task.estimatedHours}h
                            </div>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {task.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{tag}</span>
                              ))}
                              {task.tags.length > 3 && <span className="text-xs text-slate-500">+{task.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === task._id ? null : task._id)} className="text-slate-400 hover:text-white p-1">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === task._id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 mt-1 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-1 z-50">
                            <button onClick={() => handleEdit(task)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">Edit</button>
                            <div className="border-t border-slate-600 my-1" />
                            <div className="px-4 py-1 text-xs text-slate-500">Move to</div>
                            {STATUS_OPTIONS.map(opt => (
                              <button key={opt.value} onClick={() => handleStatusChange(task._id, opt.value)}
                                className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-600">
                                {opt.label}
                              </button>
                            ))}
                            <div className="border-t border-slate-600 my-1" />
                            <button onClick={() => handleDelete(task._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-600">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto">
          {STATUS_OPTIONS.map(status => (
            <div key={status.value} className="min-w-[280px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status.value).split(' ')[0]}`} />
                <h3 className="font-medium text-white">{status.label}</h3>
                <span className="text-xs text-slate-500 ml-auto">{groupedTasks[status.value]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(groupedTasks[status.value] || []).map(task => {
                  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date())) && task.status !== 'done';
                  return (
                    <div key={task._id} className={`bg-slate-800/50 border rounded-lg p-3 ${isOverdue ? 'border-red-500/50' : 'border-slate-700'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium text-sm ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(groupedTasks[status.value]?.length || 0) === 0 && (
                  <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    {PRIORITY_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    {CATEGORY_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Estimated Hours</label>
                  <input type="number" step="0.5" min="0" value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="Add tag..." />
                  <button type="button" onClick={addTag} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Add</button>
                </div>
                {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-500 transition-all">
                  {editingId ? 'Update' : 'Add'} Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
