export type UserRole = 'ADMIN' | 'GURU' | 'SISWA';

export type SubmissionStatus = 'Menunggu' | 'Diterima' | 'Revisi' | 'Selesai';

export type MediaType = 'image' | 'video' | 'embed';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  className?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StaffInvite {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'GURU';
  addedBy: string;
  createdAt?: unknown;
}

export interface AnimationClass {
  id: string;
  name: string;
  grade: 'X' | 'XI' | 'XII';
  major: string;
  homeroomTeacher?: string;
  createdAt?: unknown;
}

export interface WorkCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: unknown;
}

export interface StudentGroup {
  id: string;
  name: string;
  className: string;
  leaderName: string;
  members: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudentRecord {
  id: string;
  nis: string;
  fullName: string;
  className: string;
  groupName?: string;
  email?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Submission {
  id: string;
  trackingCode: string;
  groupName: string;
  leaderName: string;
  members: string[];
  className: string;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  externalLink: string;
  status: SubmissionStatus;
  score: number | null;
  revisionNote: string;
  isPublished: boolean;
  publishedWorkId: string;
  submitterUid: string;
  submittedAt: unknown;
  updatedAt: unknown;
}

export interface SubmissionStatusRecord {
  trackingCode: string;
  title: string;
  groupName: string;
  className: string;
  category: string;
  status: SubmissionStatus;
  score: number | null;
  revisionNote: string;
  isPublished: boolean;
  publishedWorkId: string;
  submittedAt: unknown;
  updatedAt: unknown;
}

export interface PublishedWork {
  id: string;
  submissionId: string;
  title: string;
  groupName: string;
  leaderName: string;
  members: string[];
  className: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  coverUrl: string;
  mediaType: MediaType;
  mediaUrl: string;
  externalLink: string;
  isVisible: boolean;
  isFeatured: boolean;
  publishedAt: unknown;
  updatedAt: unknown;
  isDemoSeed?: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  publishedWorks: number;
  byClass: Array<{ name: string; count: number }>;
  byCategory: Array<{ name: string; count: number }>;
}
