'use client';
import { createContext, useContext, useMemo, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PartnerTier, StaffPermissions, User } from '@/lib/types';
import { isPast } from 'date-fns';
import { getFirestore, doc, getDoc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface PartnerContextType {
  tier: PartnerTier;
  isGrowthActive: boolean; // true if on growth tier AND subscription is active/grandfathered
  limits: {
    aiCompanies: number;   // 0 or 5
    aiPayroll: number;     // 0 or 5
    staffSeats: number;    // 0 or 3
  };
  usage: {
    aiCompanies: number;
    aiPayroll: number;
    staffSeats: number;
  };
  isAtLimit: (feature: 'aiCompanies' | 'aiPayroll' | 'staffSeats') => boolean;
  // For staff: what can they do?
  permissions: StaffPermissions | null; // null = partner owner (full access)
  isOwner: boolean;
  canDo: (module: keyof StaffPermissions, level: 'view' | 'full') => boolean;
  partnerProfile: User | null;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [partnerProfile, setPartnerProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiCompaniesCount, setAiCompaniesCount] = useState(0);
  const [aiPayrollCount, setAiPayrollCount] = useState(0);
  const [staffSeatsCount, setStaffSeatsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.role === 'partner') {
      setPartnerProfile(user);
      setLoading(false);
    } else if ((user.role === 'partner_staff' || user.role === 'partner_admin' || user.role === 'staff') && user.partnerId) {
      const db = getFirestore(firebaseApp);
      getDoc(doc(db, 'users', user.partnerId)).then((snap) => {
        if (snap.exists()) {
          setPartnerProfile({ ...snap.data(), id: snap.id, uid: snap.id } as User);
        }
        setLoading(false);
      }).catch((err) => {
        console.error("Failed to load partner profile for staff:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const partnerId = partnerProfile?.uid || user?.uid;
    if (!partnerId || !(user?.role === 'partner' || user?.role === 'partner_staff' || user?.role === 'partner_admin' || user?.role === 'staff')) {
      setAiCompaniesCount(0);
      setAiPayrollCount(0);
      setStaffSeatsCount(0);
      return;
    }

    const db = getFirestore(firebaseApp);

    // 1. Listen for AI Accountant Companies
    const aiCompQuery = query(collection(db, 'aiAccountantClients'), where('createdBy', '==', partnerId));
    const unsubAiComp = onSnapshot(aiCompQuery, (snap) => {
      setAiCompaniesCount(snap.size);
    }, (err) => console.error("Error listening to AI Accountant clients:", err));

    // 2. Listen for AI Payroll Companies
    const aiPayQuery = query(collection(db, 'aiPayrollClients'), where('createdBy', '==', partnerId));
    const unsubAiPay = onSnapshot(aiPayQuery, (snap) => {
      setAiPayrollCount(snap.size);
    }, (err) => console.error("Error listening to AI Payroll clients:", err));

    // 3. Listen for active staff users and pending invites to count staff seats
    let activeStaffCount = 0;
    let pendingInvitesCount = 0;

    const updateStaffSeats = (active: number, pending: number) => {
      setStaffSeatsCount(1 + active + pending); // +1 for the owner
    };

    const staffQuery = query(
      collection(db, 'users'), 
      where('partnerId', '==', partnerId)
    );
    const unsubStaff = onSnapshot(staffQuery, (snap) => {
      const activeStaff = snap.docs.filter(doc => {
        const data = doc.data();
        const role = data.role;
        const isActive = data.isActive !== false;
        return (role === 'partner_staff' || role === 'partner_admin') && isActive;
      });
      activeStaffCount = activeStaff.length;
      updateStaffSeats(activeStaffCount, pendingInvitesCount);
    }, (err) => console.error("Error listening to staff users:", err));

    const invitesQuery = query(
      collection(db, 'partnerInvites'),
      where('partnerId', '==', partnerId),
      where('status', '==', 'pending')
    );
    const unsubInvites = onSnapshot(invitesQuery, (snap) => {
      pendingInvitesCount = snap.size;
      updateStaffSeats(activeStaffCount, pendingInvitesCount);
    }, (err) => console.error("Error listening to partner invites:", err));

    return () => {
      unsubAiComp();
      unsubAiPay();
      unsubStaff();
      unsubInvites();
    };
  }, [partnerProfile?.uid, user?.uid, user?.role]);

  const value = useMemo<PartnerContextType>(() => {
    const isOwner = user?.role === 'partner';
    const permissions = isOwner ? null : (user?.permissions ?? null);
    
    // Determine if growth is active:
    // 1. Legacy R4,950 partners (no partnerTier set) → treated as growth active
    // 2. partnerTier === 'growth' && partnerSubscription.status === 'active' AND currentPeriodEnd is in future
    // 3. grandfatheredUntil is in future
    let isGrowthActive = false;
    const targetUser = partnerProfile || user;
    const sub = targetUser?.partnerSubscription;
    
    if (targetUser && (targetUser.role === 'partner' || targetUser.role === 'partner_staff' || targetUser.role === 'partner_admin' || targetUser.role === 'staff')) {
      if (!targetUser?.partnerTier) {
        // Legacy one-time R4,950 partner — grandfather treatment
        isGrowthActive = true;
      } else if (targetUser.partnerTier === 'growth' && sub) {
        const grandfatheredUntil = sub.grandfatheredUntil?.toDate 
          ? sub.grandfatheredUntil.toDate() 
          : (sub.grandfatheredUntil ? new Date(sub.grandfatheredUntil) : null);
        const periodEnd = sub.currentPeriodEnd?.toDate 
          ? sub.currentPeriodEnd.toDate() 
          : (sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null);
        
        if (grandfatheredUntil && !isPast(grandfatheredUntil)) {
          isGrowthActive = true;
        } else if ((sub.status === 'active' || sub.status === 'trialing' || sub.status === 'pending') && periodEnd && !isPast(periodEnd)) {
          isGrowthActive = true;
        }
      }
    }
    // free tier: isGrowthActive stays false
    
    const tier: PartnerTier = isGrowthActive ? 'growth' : (targetUser?.partnerTier ?? 'free');
    
    const limits = {
      aiCompanies: isGrowthActive ? (sub?.aiCompanyLimit ?? 5) : 0,
      aiPayroll: isGrowthActive ? (sub?.aiPayrollLimit ?? 5) : 0,
      staffSeats: isGrowthActive ? (sub?.staffSeatLimit ?? 3) : 0,
    };

    const usage = {
      aiCompanies: aiCompaniesCount,
      aiPayroll: aiPayrollCount,
      staffSeats: staffSeatsCount,
    };

    const isAtLimit = (feature: 'aiCompanies' | 'aiPayroll' | 'staffSeats'): boolean => {
      if (user?.role === 'admin') return false;
      const limit = limits[feature];
      const currentUsage = usage[feature];
      return currentUsage >= limit;
    };
    
    const canDo = (module: keyof StaffPermissions, level: 'view' | 'full'): boolean => {
      if (isOwner) return true; // owner can do everything
      if (!permissions) return false;
      const perm = permissions[module];
      if (level === 'view') return perm === 'view' || perm === 'full';
      if (level === 'full') return perm === 'full';
      return false;
    };
    
    return { tier, isGrowthActive, limits, usage, isAtLimit, permissions, isOwner, canDo, partnerProfile };
  }, [user, partnerProfile, aiCompaniesCount, aiPayrollCount, staffSeatsCount]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error('usePartner must be used within PartnerProvider');
  return ctx;
}
