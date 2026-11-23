import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CLASSES,
  SEED_GROUPS,
  SEED_PUBLISHED_WORKS,
  SEED_STUDENTS,
} from '../data/seedWorks';
import type {
  AnimationClass,
  MediaType,
  PublishedWork,
  StaffInvite,
  StudentGroup,
  StudentRecord,
  Submission,
  SubmissionStatus,
  SubmissionStatusRecord,
  UserAccount,
  UserRole,
  WorkCategory,
} from '../types';
import { generateTrackingCode, slugifyCategory } from '../utils/validation';
import { publishAssetToServer } from './api';

function toEpochMs(val: unknown): number {
  if (!val) return 0;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
    return (val as { seconds: number }).seconds * 1000;
  }
  return 0;
}

export function subscribePublishedWorks(
  onlyVisible: boolean,
  onData: (works: PublishedWork[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'published_works';
  const q = onlyVisible
    ? query(collection(db, path), where('isVisible', '==', true))
    : query(collection(db, path), orderBy('publishedAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: PublishedWork[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PublishedWork, 'id'>),
        }))
        .sort((a, b) => toEpochMs(b.publishedAt) - toEpochMs(a.publishedAt));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Error already logged cleanly
      }
    }
  );
}

export function subscribeClasses(
  onData: (items: AnimationClass[]) => void
): Unsubscribe {
  const path = 'classes';
  const q = query(collection(db, path), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AnimationClass, 'id'>),
        }))
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Fallback handled in UI
      }
    }
  );
}

export function subscribeCategories(
  onData: (items: WorkCategory[]) => void
): Unsubscribe {
  const path = 'categories';
  const q = query(collection(db, path), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorkCategory, 'id'>),
        }))
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Fallback handled in UI
      }
    }
  );
}

export function subscribeSubmissions(
  onData: (items: Submission[]) => void,
  filterUid?: string
): Unsubscribe {
  const path = 'submissions';
  const q = filterUid
    ? query(collection(db, path), where('submitterUid', '==', filterUid))
    : query(collection(db, path), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Submission, 'id'>),
          }))
          .sort((a, b) => toEpochMs(b.submittedAt) - toEpochMs(a.submittedAt))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeGroups(onData: (items: StudentGroup[]) => void): Unsubscribe {
  const path = 'groups';
  return onSnapshot(
    query(collection(db, path), orderBy('name', 'asc')),
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StudentGroup, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeStudents(onData: (items: StudentRecord[]) => void): Unsubscribe {
  const path = 'students';
  return onSnapshot(
    query(collection(db, path), orderBy('fullName', 'asc')),
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StudentRecord, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeStaffInvites(onData: (items: StaffInvite[]) => void): Unsubscribe {
  const path = 'staff_invites';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StaffInvite, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUsers(onData: (items: UserAccount[]) => void): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      onData(snap.docs.map((d) => d.data() as UserAccount));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createSubmissionRecord(payload: {
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
  submitterUid: string;
}): Promise<{ id: string; trackingCode: string }> {
  const submissionRef = doc(collection(db, 'submissions'));
  const trackingCode = generateTrackingCode();
  const statusRef = doc(db, 'submission_statuses', trackingCode);

  const batch = writeBatch(db);
  batch.set(submissionRef, {
    trackingCode,
    groupName: payload.groupName.trim(),
    leaderName: payload.leaderName.trim(),
    members: payload.members.map((m) => m.trim()).filter(Boolean),
    className: payload.className.trim(),
    title: payload.title.trim(),
    category: payload.category.trim(),
    description: payload.description.trim(),
    fileUrl: payload.fileUrl,
    fileName: payload.fileName,
    fileType: payload.fileType,
    fileSize: payload.fileSize,
    externalLink: payload.externalLink.trim(),
    status: 'Menunggu' as SubmissionStatus,
    score: null,
    revisionNote: '',
    isPublished: false,
    publishedWorkId: '',
    submitterUid: payload.submitterUid,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(statusRef, {
    trackingCode,
    title: payload.title.trim(),
    groupName: payload.groupName.trim(),
    className: payload.className.trim(),
    category: payload.category.trim(),
    status: 'Menunggu' as SubmissionStatus,
    score: null,
    revisionNote: '',
    isPublished: false,
    publishedWorkId: '',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return { id: submissionRef.id, trackingCode };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `submissions/${submissionRef.id}`);
  }
}

export async function lookupSubmissionStatus(
  trackingCode: string
): Promise<SubmissionStatusRecord | null> {
  const cleanCode = trackingCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(cleanCode)) {
    return null;
  }
  const path = `submission_statuses/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'submission_statuses', cleanCode));
    if (!snap.exists()) return null;
    return snap.data() as SubmissionStatusRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateSubmissionByTeacher(
  submission: Submission,
  updates: {
    groupName: string;
    leaderName: string;
    members: string[];
    className: string;
    title: string;
    category: string;
    description: string;
    status: SubmissionStatus;
    score: number | null;
    revisionNote: string;
  }
): Promise<void> {
  const batch = writeBatch(db);
  const subRef = doc(db, 'submissions', submission.id);
  const statusRef = doc(db, 'submission_statuses', submission.trackingCode);

  batch.update(subRef, {
    groupName: updates.groupName.trim(),
    leaderName: updates.leaderName.trim(),
    members: updates.members.map((m) => m.trim()).filter(Boolean),
    className: updates.className.trim(),
    title: updates.title.trim(),
    category: updates.category.trim(),
    description: updates.description.trim(),
    status: updates.status,
    score: updates.score,
    revisionNote: updates.revisionNote.trim(),
    updatedAt: serverTimestamp(),
  });

  batch.set(
    statusRef,
    {
      trackingCode: submission.trackingCode,
      title: updates.title.trim(),
      groupName: updates.groupName.trim(),
      className: updates.className.trim(),
      category: updates.category.trim(),
      status: updates.status,
      score: updates.score,
      revisionNote: updates.revisionNote.trim(),
      isPublished: submission.isPublished,
      publishedWorkId: submission.publishedWorkId,
      submittedAt: submission.submittedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `submissions/${submission.id}`);
  }
}

export async function deleteSubmissionRecord(submission: Submission): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'submissions', submission.id));
  batch.delete(doc(db, 'submission_statuses', submission.trackingCode));
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `submissions/${submission.id}`);
  }
}

export async function publishSubmissionToGallery(params: {
  submission: Submission;
  title: string;
  description: string;
  thumbnailUrl: string;
  coverUrl: string;
  mediaType: MediaType;
  mediaUrl: string;
  isFeatured: boolean;
}): Promise<string> {
  const { submission } = params;
  // Open public read on uploaded file if it resides in /api/files/
  if (params.thumbnailUrl.startsWith('/api/files/')) {
    await publishAssetToServer(params.thumbnailUrl);
  }
  if (params.mediaUrl.startsWith('/api/files/')) {
    await publishAssetToServer(params.mediaUrl);
  }
  if (params.coverUrl.startsWith('/api/files/')) {
    await publishAssetToServer(params.coverUrl);
  }

  const workId = submission.publishedWorkId || doc(collection(db, 'published_works')).id;
  const workRef = doc(db, 'published_works', workId);
  const subRef = doc(db, 'submissions', submission.id);
  const statusRef = doc(db, 'submission_statuses', submission.trackingCode);

  const batch = writeBatch(db);
  batch.set(workRef, {
    submissionId: submission.id,
    title: params.title.trim(),
    groupName: submission.groupName,
    leaderName: submission.leaderName,
    members: submission.members,
    className: submission.className,
    category: submission.category,
    description: params.description.trim(),
    thumbnailUrl: params.thumbnailUrl,
    coverUrl: params.coverUrl,
    mediaType: params.mediaType,
    mediaUrl: params.mediaUrl,
    externalLink: submission.externalLink,
    isVisible: true,
    isFeatured: params.isFeatured,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(subRef, {
    status: submission.status === 'Menunggu' ? 'Diterima' : submission.status,
    isPublished: true,
    publishedWorkId: workId,
    updatedAt: serverTimestamp(),
  });

  batch.update(statusRef, {
    status: submission.status === 'Menunggu' ? 'Diterima' : submission.status,
    isPublished: true,
    publishedWorkId: workId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return workId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `published_works/${workId}`);
  }
}

export async function updatePublishedWorkRecord(
  workId: string,
  updates: Partial<
    Pick<
      PublishedWork,
      'title' | 'description' | 'thumbnailUrl' | 'coverUrl' | 'isVisible' | 'isFeatured'
    >
  >
): Promise<void> {
  if (updates.thumbnailUrl?.startsWith('/api/files/')) {
    await publishAssetToServer(updates.thumbnailUrl);
  }
  if (updates.coverUrl?.startsWith('/api/files/')) {
    await publishAssetToServer(updates.coverUrl);
  }
  try {
    await updateDoc(doc(db, 'published_works', workId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `published_works/${workId}`);
  }
}

export async function deletePublishedWorkRecord(work: PublishedWork): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'published_works', work.id));
  if (work.submissionId) {
    batch.update(doc(db, 'submissions', work.submissionId), {
      isPublished: false,
      publishedWorkId: '',
      updatedAt: serverTimestamp(),
    });
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `published_works/${work.id}`);
  }
}

export async function saveClassRecord(
  payload: Omit<AnimationClass, 'id' | 'createdAt'>,
  existingId?: string
): Promise<void> {
  const id = existingId || slugifyCategory(payload.name) || doc(collection(db, 'classes')).id;
  try {
    if (existingId) {
      await updateDoc(doc(db, 'classes', id), {
        name: payload.name.trim(),
        grade: payload.grade,
        major: payload.major.trim(),
        homeroomTeacher: (payload.homeroomTeacher ?? '').trim(),
      });
    } else {
      await setDoc(doc(db, 'classes', id), {
        name: payload.name.trim(),
        grade: payload.grade,
        major: payload.major.trim(),
        homeroomTeacher: (payload.homeroomTeacher ?? '').trim(),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${id}`);
  }
}

export async function deleteClassRecord(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'classes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `classes/${id}`);
  }
}

export async function saveCategoryRecord(
  payload: { name: string; description: string },
  existingId?: string
): Promise<void> {
  const slug = slugifyCategory(payload.name) || `cat-${Date.now()}`;
  const id = existingId || slug;
  try {
    if (existingId) {
      await updateDoc(doc(db, 'categories', id), {
        name: payload.name.trim(),
        slug,
        description: payload.description.trim(),
      });
    } else {
      await setDoc(doc(db, 'categories', id), {
        name: payload.name.trim(),
        slug,
        description: payload.description.trim(),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `categories/${id}`);
  }
}

export async function deleteCategoryRecord(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
  }
}

export async function saveGroupRecord(
  payload: Omit<StudentGroup, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const id = existingId || doc(collection(db, 'groups')).id;
  try {
    if (existingId) {
      await updateDoc(doc(db, 'groups', id), {
        name: payload.name.trim(),
        className: payload.className.trim(),
        leaderName: payload.leaderName.trim(),
        members: payload.members.map((m) => m.trim()).filter(Boolean),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'groups', id), {
        name: payload.name.trim(),
        className: payload.className.trim(),
        leaderName: payload.leaderName.trim(),
        members: payload.members.map((m) => m.trim()).filter(Boolean),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${id}`);
  }
}

export async function deleteGroupRecord(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'groups', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `groups/${id}`);
  }
}

export async function saveStudentRecord(
  payload: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const id = existingId || doc(collection(db, 'students')).id;
  try {
    if (existingId) {
      await updateDoc(doc(db, 'students', id), {
        nis: payload.nis.trim(),
        fullName: payload.fullName.trim(),
        className: payload.className.trim(),
        groupName: (payload.groupName ?? '').trim(),
        email: (payload.email ?? '').trim(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'students', id), {
        nis: payload.nis.trim(),
        fullName: payload.fullName.trim(),
        className: payload.className.trim(),
        groupName: (payload.groupName ?? '').trim(),
        email: (payload.email ?? '').trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${id}`);
  }
}

export async function deleteStudentRecord(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
  }
}

export async function addStaffInvite(payload: {
  email: string;
  fullName: string;
  role: 'ADMIN' | 'GURU';
  addedBy: string;
}): Promise<void> {
  const emailKey = payload.email.trim().toLowerCase();
  try {
    await setDoc(doc(db, 'staff_invites', emailKey), {
      email: emailKey,
      fullName: payload.fullName.trim(),
      role: payload.role,
      addedBy: payload.addedBy,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `staff_invites/${emailKey}`);
  }
}

export async function deleteStaffInvite(emailKey: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'staff_invites', emailKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff_invites/${emailKey}`);
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function seedInitialSchoolDataToFirestore(): Promise<void> {
  const batch = writeBatch(db);

  for (const cls of DEFAULT_CLASSES) {
    batch.set(doc(db, 'classes', cls.id), {
      name: cls.name,
      grade: cls.grade,
      major: cls.major,
      homeroomTeacher: cls.homeroomTeacher ?? '',
      createdAt: serverTimestamp(),
    });
  }

  for (const cat of DEFAULT_CATEGORIES) {
    batch.set(doc(db, 'categories', cat.id), {
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      createdAt: serverTimestamp(),
    });
  }

  for (const grp of SEED_GROUPS) {
    batch.set(doc(db, 'groups', grp.id), {
      name: grp.name,
      className: grp.className,
      leaderName: grp.leaderName,
      members: grp.members,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const stu of SEED_STUDENTS) {
    batch.set(doc(db, 'students', stu.id), {
      nis: stu.nis,
      fullName: stu.fullName,
      className: stu.className,
      groupName: stu.groupName ?? '',
      email: stu.email ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const work of SEED_PUBLISHED_WORKS) {
    batch.set(doc(db, 'published_works', work.id), {
      submissionId: '',
      title: work.title,
      groupName: work.groupName,
      leaderName: work.leaderName,
      members: work.members,
      className: work.className,
      category: work.category,
      description: work.description,
      thumbnailUrl: work.thumbnailUrl,
      coverUrl: work.coverUrl,
      mediaType: work.mediaType,
      mediaUrl: work.mediaUrl,
      externalLink: work.externalLink,
      isVisible: work.isVisible,
      isFeatured: work.isFeatured,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedInitialSchoolData');
  }
}

export async function exportFullBackupJson(): Promise<Record<string, unknown>> {
  const collectionsToExport = [
    'classes',
    'categories',
    'groups',
    'students',
    'submissions',
    'published_works',
  ] as const;

  const result: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    app: 'GALERI KARYA SISWA SMK ANIMASI',
  };

  for (const colName of collectionsToExport) {
    try {
      const snap = await getDocs(collection(db, colName));
      result[colName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colName);
    }
  }

  return result;
}
