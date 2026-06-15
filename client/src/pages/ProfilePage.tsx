import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI, applicationAPI, taskAPI } from '../lib/api';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Edit2, Save, Briefcase, Calendar, Award, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileStats {
  totalApplications: number;
  interviews: number;
  offers: number;
  tasksCompleted: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({ totalApplications: 0, interviews: 0, offers: 0, tasksCompleted: 0 });
  const [formData, setFormData] = useState({
    fullName: '', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '', bio: '', skills: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const res = await profileAPI.get();
      setProfile(res.data);
      setFormData({
        fullName: res.data.fullName || '',
        phone: res.data.phone || '',
        location: res.data.location || '',
        linkedinUrl: res.data.linkedinUrl || '',
        githubUrl: res.data.githubUrl || '',
        portfolioUrl: res.data.portfolioUrl || '',
        bio: res.data.bio || '',
        skills: (res.data.skills || []).join(', ')
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchStats() {
    try {
      const [appsRes, tasksRes] = await Promise.all([applicationAPI.getAll(), taskAPI.getAll()]);
      const applications = appsRes.data || [];
      const tasks = tasksRes.data || [];
      setStats({
        totalApplications: applications.length,
        interviews: applications.filter((a: any) => a.status === 'interviewing').length,
        offers: applications.filter((a: any) => a.status === 'offer').length,
        tasksCompleted: tasks.filter((t: any) => t.status === 'done').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

    try {
      const res = await profileAPI.update({
        fullName: formData.fullName || undefined,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
        bio: formData.bio || undefined,
        skills: skillsArray.length > 0 ? skillsArray : undefined
      });
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
    setLoading(false);
  };

  const cancelEdit = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        bio: profile.bio || '',
        skills: (profile.skills || []).join(', ')
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-slate-400 mt-1">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-800">
              {profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="email" value={user?.email || ''} disabled className="w-full bg-slate-900/30 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-400 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="San Francisco, CA" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">LinkedIn</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="url" value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">GitHub</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="url" value={formData.githubUrl} onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="https://github.com/..." />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Portfolio</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="url" value={formData.portfolioUrl} onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="https://yourportfolio.com" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none" placeholder="Tell us about yourself..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Skills (comma separated)</label>
                  <input type="text" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="React, TypeScript, Node.js, Python..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={cancelEdit} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{profile?.fullName || 'User'}</h2>
                <p className="text-slate-400">{user?.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-slate-300"><Phone className="w-5 h-5 text-slate-500" /><span>{profile.phone}</span></div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-3 text-slate-300"><MapPin className="w-5 h-5 text-slate-500" /><span>{profile.location}</span></div>
                )}
                {profile?.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Linkedin className="w-5 h-5" /><span>LinkedIn Profile</span>
                  </a>
                )}
                {profile?.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Github className="w-5 h-5" /><span>GitHub Profile</span>
                  </a>
                )}
                {profile?.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Globe className="w-5 h-5" /><span>Portfolio</span>
                  </a>
                )}
              </div>

              {profile?.bio && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">About</h3>
                  <p className="text-white">{profile.bio}</p>
                </div>
              )}

              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
                Member since {profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'N/A'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Applications', value: stats.totalApplications, icon: Briefcase, color: 'text-cyan-400' },
          { label: 'Interviews', value: stats.interviews, icon: Calendar, color: 'text-amber-400' },
          { label: 'Offers', value: stats.offers, icon: Award, color: 'text-emerald-400' },
          { label: 'Tasks Done', value: stats.tasksCompleted, icon: TrendingUp, color: 'text-blue-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-slate-400">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
