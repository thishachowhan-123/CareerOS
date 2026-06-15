export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  skills?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  user: string;
  company: string;
  position: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract';
  status: 'wishlist' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  appliedDate?: string;
  deadline?: string;
  salary?: string;
  location?: string;
  remoteType: 'onsite' | 'remote' | 'hybrid';
  jobUrl?: string;
  description?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  interviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  user: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'application' | 'interview' | 'skill' | 'network' | 'resume';
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  application?: string;
  createdAt: string;
  updatedAt: string;
}
