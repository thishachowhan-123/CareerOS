import { useEffect, useState } from 'react';
import { applicationAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Application } from '../types';
import { Plus, Search, Filter, MoreVertical, Building2, MapPin, Calendar, DollarSign, ExternalLink, Eye, Edit, Trash2, X, ChevronDown, Briefcase, Clock, Users, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' }
];

const REMOTE_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
];

interface FormData {
  company: string; position: string; jobType: string; status: string;
  appliedDate: string; deadline: string; salary: string; location: string;
  remoteType: string; jobUrl: string; description: string; notes: string;
  contactName: string; contactEmail: string; contactPhone: string;
}

const initialFormData: FormData = {
  company: '', position: '', jobType: 'full-time', status: 'wishlist',
  appliedDate: '', deadline: '', salary: '', location: '', remoteType: 'onsite',
  jobUrl: '', description: '', notes: '', contactName: '', contactEmail: '', contactPhone: ''
};

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    wishlist: 'bg-slate-500/20 text-slate-300', applied: 'bg-blue-500/20 text-blue-300',
    screening: 'bg-cyan-500/20 text-cyan-300', interviewing: 'bg-amber-500/20 text-amber-300',
    offer: 'bg-emerald-500/20 text-emerald-300', rejected: 'bg-red-500/20 text-red-300',
    withdrawn: 'bg-slate-500/20 text-slate-300'
  };
  return colors[status] || 'bg-slate-500/20 text-slate-300';
}

function getRemoteColor(type: string): string {
  const colors: Record<string, string> = {
    onsite: 'bg-slate-500/20 text-slate-300', remote: 'bg-emerald-500/20 text-emerald-300',
    hybrid: 'bg-blue-500/20 text-blue-300'
  };
  return colors[type] || 'bg-slate-500/20 text-slate-300';
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => { if (user) fetchApplications(); }, [user]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await applicationAPI.getAll();
      setApplications(res.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
    setLoading(false);
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        appliedDate: formData.appliedDate || undefined,
        deadline: formData.deadline || undefined,
        salary: formData.salary || undefined,
        location: formData.location || undefined,
        jobUrl: formData.jobUrl || undefined,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined
      };

      if (editingId) {
        await applicationAPI.update(editingId, data);
      } else {
        await applicationAPI.create(data);
      }
      fetchApplications();
    } catch (error) {
      console.error('Error saving application:', error);
    }
    closeModal();
  };

  const handleEdit = (app: Application) => {
    setFormData({
      company: app.company, position: app.position, jobType: app.jobType, status: app.status,
      appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : '',
      deadline: app.deadline ? app.deadline.split('T')[0] : '',
      salary: app.salary || '', location: app.location || '', remoteType: app.remoteType,
      jobUrl: app.jobUrl || '', description: app.description || '', notes: app.notes || '',
      contactName: app.contactName || '', contactEmail: app.contactEmail || '', contactPhone: app.contactPhone || ''
    });
    setEditingId(app._id);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await applicationAPI.delete(id);
      setApplications(applications.filter(a => a._id !== id));
    } catch (error) {
      console.error('Error deleting application:', error);
    }
    setOpenMenuId(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await applicationAPI.update(id, { status });
      setApplications(applications.map(a => a._id === id ? { ...a, status: status as any } : a));
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const stats = {
    total: applications.length,
    wishlist: applications.filter(a => a.status === 'wishlist').length,
    applied: applications.filter(a => a.status === 'applied').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offers: applications.filter(a => a.status === 'offer').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-slate-400 mt-1">Track your job and internship applications</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-400 hover:to-blue-500 transition-all">
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[{ label: 'Total', value: stats.total, icon: Briefcase, color: 'text-cyan-400' },
          { label: 'Wishlist', value: stats.wishlist, icon: Clock, color: 'text-slate-400' },
          { label: 'Applied', value: stats.applied, icon: Briefcase, color: 'text-blue-400' },
          { label: 'Interviewing', value: stats.interviewing, icon: Users, color: 'text-amber-400' },
          { label: 'Offers', value: stats.offers, icon: Award, color: 'text-emerald-400' }
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
          <input type="text" placeholder="Search applications..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-8 py-2.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 border border-slate-700 rounded-xl">
          <Briefcase className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
          <p className="text-slate-400">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first application to get started'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApplications.map(app => (
            <div key={app._id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{app.company}</h3>
                    <p className="text-sm text-slate-400">{app.position}</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === app._id ? null : app._id)} className="text-slate-400 hover:text-white p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openMenuId === app._id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 mt-1 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-1 z-50">
                        <button onClick={() => handleEdit(app)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <div className="border-t border-slate-600 my-1" />
                        <div className="px-4 py-1 text-xs text-slate-500">Change Status</div>
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => handleStatusChange(app._id, opt.value)}
                            className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-600">
                            {opt.label}
                          </button>
                        ))}
                        <div className="border-t border-slate-600 my-1" />
                        <button onClick={() => handleDelete(app._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-600">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {app.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{app.location}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${getRemoteColor(app.remoteType)}`}>{app.remoteType}</span>
                  </div>
                )}
                {app.appliedDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Applied {format(new Date(app.appliedDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {app.salary && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{app.salary}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>{formatStatus(app.status)}</span>
                {app.jobUrl && (
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
                    View Job <ExternalLink className="w-3 h-3" />
                  </a>
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
          <div className="relative bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Application' : 'Add New Application'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Company *</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Position *</label>
                  <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Type</label>
                  <select value={formData.jobType} onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    {JOB_TYPE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Applied Date</label>
                  <input type="date" value={formData.appliedDate} onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="City, State" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Type</label>
                  <select value={formData.remoteType} onChange={(e) => setFormData({ ...formData, remoteType: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    {REMOTE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Salary</label>
                  <input type="text" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="$100,000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Job URL</label>
                  <input type="url" value={formData.jobUrl} onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-500 transition-all">
                  {editingId ? 'Update' : 'Add'} Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
