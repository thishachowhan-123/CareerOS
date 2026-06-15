import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI, taskAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Application, Task } from '../types';
import {
  Briefcase, ListTodo, Calendar, TrendingUp, Clock, CheckCircle2, Users, Building2, ArrowRight, Plus, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';

const COLORS = ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];

interface Stats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  tasksCompleted: number;
  tasksPending: number;
  recentApplications: Application[];
  overdueTasks: Task[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0, activeApplications: 0, interviews: 0, offers: 0,
    tasksCompleted: 0, tasksPending: 0, recentApplications: [], overdueTasks: []
  });
  const [applicationTrend, setApplicationTrend] = useState<{ date: string; count: number }[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [appsRes, tasksRes] = await Promise.all([
        applicationAPI.getAll(),
        taskAPI.getAll()
      ]);

      const applications = appsRes.data || [];
      const tasks = tasksRes.data || [];

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      const recentApps = applications.filter((app: Application) => {
        const appDate = app.appliedDate ? new Date(app.appliedDate) : null;
        return appDate && isAfter(appDate, thirtyDaysAgo);
      });

      const trendData: { [key: string]: number } = {};
      for (let i = 29; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'MMM dd');
        trendData[dateStr] = 0;
      }

      recentApps.forEach((app: Application) => {
        if (app.appliedDate) {
          const dateStr = format(new Date(app.appliedDate), 'MMM dd');
          if (trendData[dateStr] !== undefined) trendData[dateStr]++;
        }
      });

      setApplicationTrend(Object.entries(trendData).map(([date, count]) => ({ date, count })));

      const statusCounts: { [key: string]: number } = {};
      applications.forEach((app: Application) => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });

      setStatusDistribution(
        Object.entries(statusCounts).filter(([, count]) => count > 0).map(([name, value]) => ({ name: formatStatusName(name), value }))
      );

      const overdueTasks = tasks.filter((task: Task) => {
        if (task.status === 'done') return false;
        if (!task.dueDate) return false;
        return isBefore(new Date(task.dueDate), startOfDay(now));
      });

      setStats({
        totalApplications: applications.length,
        activeApplications: applications.filter((a: Application) => ['applied', 'screening', 'interviewing'].includes(a.status)).length,
        interviews: applications.filter((a: Application) => a.status === 'interviewing').length,
        offers: applications.filter((a: Application) => a.status === 'offer').length,
        tasksCompleted: tasks.filter((t: Task) => t.status === 'done').length,
        tasksPending: tasks.filter((t: Task) => t.status !== 'done').length,
        recentApplications: applications.slice(0, 5),
        overdueTasks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  }

  function formatStatusName(status: string): string {
    const names: { [key: string]: string } = {
      wishlist: 'Wishlist', applied: 'Applied', screening: 'Screening',
      interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn'
    };
    return names[status] || status;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Track your career progress</p>
        </div>
        <Link to="/applications" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-400 hover:to-blue-500 transition-all">
          <Plus className="w-4 h-4" /> New Application
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.totalApplications} icon={Briefcase} color="cyan" />
        <StatCard title="Active Applications" value={stats.activeApplications} icon={Clock} color="blue" />
        <StatCard title="Upcoming Interviews" value={stats.interviews} icon={Users} color="emerald" />
        <StatCard title="Offers" value={stats.offers} icon={CheckCircle2} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Application Activity</h2>
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">Last 30 days</span>
          </div>
          <div className="h-64">
            {applicationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationTrend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#06b6d4' }} />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-500"><p>No data yet</p></div>}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Application Status</h2>
          <div className="h-64 flex items-center justify-center">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                    {statusDistribution.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500">No applications yet</p>}
          </div>
          {statusDistribution.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {statusDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tasks Overview</h2>
            <Link to="/tasks" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-bold text-white">{stats.tasksCompleted}</span>
              </div>
              <p className="text-slate-400 text-sm mt-1">Completed</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">{stats.tasksPending}</span>
              </div>
              <p className="text-slate-400 text-sm mt-1">Pending</p>
            </div>
          </div>
          {stats.tasksCompleted + stats.tasksPending > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-medium">
                  {Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Overdue Tasks</h2>
          </div>
          {stats.overdueTasks.length > 0 ? (
            <div className="space-y-3">
              {stats.overdueTasks.slice(0, 5).map((task) => (
                <div key={task._id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-white font-medium text-sm truncate">{task.title}</p>
                  {task.dueDate && <p className="text-red-400 text-xs mt-1">Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</p>}
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-slate-500"><p>No overdue tasks</p></div>}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Applications</h2>
          <Link to="/applications" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {stats.recentApplications.length > 0 ? (
          <div className="space-y-3">
            {stats.recentApplications.map((app) => (
              <div key={app._id} className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{app.company}</p>
                    <p className="text-slate-400 text-sm">{app.position}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                  {formatStatusName(app.status)}
                </span>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-8 text-slate-500"><Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No applications yet</p></div>}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: 'cyan' | 'blue' | 'emerald' | 'amber' }) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color].split(' ').pop()}`} />
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    wishlist: 'bg-slate-500/20 text-slate-300',
    applied: 'bg-blue-500/20 text-blue-300',
    screening: 'bg-cyan-500/20 text-cyan-300',
    interviewing: 'bg-amber-500/20 text-amber-300',
    offer: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-red-500/20 text-red-300',
    withdrawn: 'bg-slate-500/20 text-slate-300'
  };
  return colors[status] || 'bg-slate-500/20 text-slate-300';
}
