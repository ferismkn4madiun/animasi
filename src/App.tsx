import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ADMIN_BOOTSTRAP_EMAIL, auth, db, googleProvider } from './firebase';
import type {
  AnimationClass,
  PublishedWork,
  StaffInvite,
  StudentGroup,
  StudentRecord,
  Submission,
  UserAccount,
  UserRole,
  WorkCategory,
} from './types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CLASSES,
  SEED_PUBLISHED_WORKS,
} from './data/seedWorks';
import {
  subscribeCategories,
  subscribeClasses,
  subscribeGroups,
  subscribePublishedWorks,
  subscribeStaffInvites,
  subscribeStudents,
  subscribeSubmissions,
  subscribeUsers,
} from './services/firestoreService';
import { syncStaffEmailsToServer } from './services/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar, type AppView } from './components/Navbar';
import { GalleryView } from './components/GalleryView';
import { WorkDetailModal } from './components/WorkDetailModal';
import { SubmissionForm } from './components/SubmissionForm';
import { StatusTrackerView } from './components/StatusTrackerView';
import { DashboardView } from './components/DashboardView';

async function resolveOrCreateUserProfile(firebaseUser: User): Promise<UserAccount> {
  const email = (firebaseUser.email || '').toLowerCase();
  const userRef = doc(db, 'users', firebaseUser.uid);
  const existingSnap = await getDoc(userRef);

  if (existingSnap.exists()) {
    return existingSnap.data() as UserAccount;
  }

  let role: UserRole = 'SISWA';
  if (email === ADMIN_BOOTSTRAP_EMAIL && firebaseUser.emailVerified) {
    role = 'ADMIN';
  } else if (email && firebaseUser.emailVerified) {
    try {
      const inviteSnap = await getDoc(doc(db, 'staff_invites', email));
      if (inviteSnap.exists()) {
        const invData = inviteSnap.data() as { role?: 'ADMIN' | 'GURU' };
        if (invData.role === 'ADMIN' || invData.role === 'GURU') {
          role = invData.role;
        }
      }
    } catch {
      // No invite found; stays SISWA
    }
  }

  const profile: UserAccount = {
    uid: firebaseUser.uid,
    email,
    displayName: firebaseUser.displayName || email.split('@')[0] || 'Pengguna',
    role,
    className: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profile);
  return profile;
}

function AppContent() {
  const [activeView, setActiveView] = useState<AppView>('gallery');
  const [userProfile, setUserProfile] = useState<UserAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState<string>('');
  const [selectedWork, setSelectedWork] = useState<PublishedWork | null>(null);
  const [statusPrefillCode, setStatusPrefillCode] = useState<string>('');

  const [firestoreWorks, setFirestoreWorks] = useState<PublishedWork[]>([]);
  const [worksLoaded, setWorksLoaded] = useState(false);
  const [firestoreClasses, setFirestoreClasses] = useState<AnimationClass[]>([]);
  const [firestoreCategories, setFirestoreCategories] = useState<WorkCategory[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? '' : prev));
    }, 4500);
  };

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }
      try {
        const profile = await resolveOrCreateUserProfile(fbUser);
        setUserProfile(profile);
      } catch (err) {
        console.error('Gagal memuat profil pengguna:', err);
        setUserProfile(null);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Public Subscriptions (Classes, Categories, Published Works)
  useEffect(() => {
    const isStaff = userProfile?.role === 'ADMIN' || userProfile?.role === 'GURU';
    const unsubWorks = subscribePublishedWorks(
      !isStaff,
      (items) => {
        setFirestoreWorks(items);
        setWorksLoaded(true);
      },
      () => setWorksLoaded(true)
    );
    const unsubClasses = subscribeClasses(setFirestoreClasses);
    const unsubCats = subscribeCategories(setFirestoreCategories);

    return () => {
      unsubWorks();
      unsubClasses();
      unsubCats();
    };
  }, [userProfile?.role]);

  // Staff-only Subscriptions
  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'ADMIN' && userProfile.role !== 'GURU')) {
      setSubmissions([]);
      setGroups([]);
      setStudents([]);
      setStaffInvites([]);
      setUsers([]);
      return;
    }
    const unsubSubs = subscribeSubmissions(setSubmissions);
    const unsubGroups = subscribeGroups(setGroups);
    const unsubStudents = subscribeStudents(setStudents);

    let unsubInvites = () => {};
    let unsubUsers = () => {};
    if (userProfile.role === 'ADMIN') {
      unsubInvites = subscribeStaffInvites((invites) => {
        setStaffInvites(invites);
        void syncStaffEmailsToServer(invites.map((i) => i.email));
      });
      unsubUsers = subscribeUsers(setUsers);
    }

    return () => {
      unsubSubs();
      unsubGroups();
      unsubStudents();
      unsubInvites();
      unsubUsers();
    };
  }, [userProfile]);

  const effectiveClasses: AnimationClass[] = useMemo(
    () =>
      firestoreClasses.length > 0
        ? firestoreClasses
        : DEFAULT_CLASSES.map((c) => ({ ...c, createdAt: '' })),
    [firestoreClasses]
  );

  const effectiveCategories: WorkCategory[] = useMemo(
    () =>
      firestoreCategories.length > 0
        ? firestoreCategories
        : DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: '' })),
    [firestoreCategories]
  );

  const effectiveWorks: PublishedWork[] = useMemo(() => {
    if (firestoreWorks.length > 0) return firestoreWorks;
    // Show curated starter showcase before Admin seeds Firestore
    if (userProfile?.role === 'ADMIN' || userProfile?.role === 'GURU') {
      return [];
    }
    return SEED_PUBLISHED_WORKS;
  }, [firestoreWorks, userProfile?.role]);

  // Deep-link ?karya=id support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const karyaId = params.get('karya');
    if (karyaId && effectiveWorks.length > 0) {
      const found = effectiveWorks.find((w) => w.id === karyaId);
      if (found) setSelectedWork(found);
    }
  }, [effectiveWorks]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      notify('Berhasil masuk dengan akun Google.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserProfile(null);
    notify('Anda telah keluar dari sesi akun.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        userProfile={userProfile}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700"
        >
          {toast}
        </div>
      )}

      <main className="flex-1">
        {activeView === 'gallery' && (
          <GalleryView
            works={effectiveWorks}
            categories={effectiveCategories}
            classes={effectiveClasses}
            loading={!worksLoaded && firestoreWorks.length === 0 && effectiveWorks.length === 0}
            onSelectWork={setSelectedWork}
            onGoToSubmit={() => setActiveView('submit')}
          />
        )}

        {activeView === 'submit' && (
          <SubmissionForm
            classes={effectiveClasses}
            categories={effectiveCategories}
            userProfile={userProfile}
            onGoToStatus={(code) => {
              setStatusPrefillCode(code);
              setActiveView('status');
            }}
          />
        )}

        {activeView === 'status' && (
          <StatusTrackerView
            initialTrackingCode={statusPrefillCode}
            userProfile={userProfile}
            onSignIn={handleSignIn}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            authLoading={authLoading}
            onSignIn={handleSignIn}
            submissions={submissions}
            publishedWorks={firestoreWorks}
            classes={effectiveClasses}
            categories={effectiveCategories}
            groups={groups}
            students={students}
            staffInvites={staffInvites}
            users={users}
            onNotify={notify}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-800">
            GALERI KARYA SISWA SMK ANIMASI
          </p>
          <p>
            Portofolio Digital &amp; Sistem Pengumpulan Tugas Jurusan Animasi
          </p>
        </div>
      </footer>

      <WorkDetailModal work={selectedWork} onClose={() => setSelectedWork(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
