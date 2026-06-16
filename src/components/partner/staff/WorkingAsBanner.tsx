'use client';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

export function WorkingAsBanner() {
  const { user } = useAuth();
  const [partnerName, setPartnerName] = useState<string>('');
  
  useEffect(() => {
    if (user?.partnerId) {
      const db = getFirestore(firebaseApp);
      getDoc(doc(db, 'users', user.partnerId)).then(snap => {
        if (snap.exists()) {
          setPartnerName(snap.data().companyName || snap.data().name || 'Partner Firm');
        }
      });
    }
  }, [user?.partnerId]);
  
  if (!partnerName) return null;
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md text-xs font-medium text-primary mb-4">
      <Building2 className="h-3.5 w-3.5 shrink-0" />
      <span>Working inside: <strong>{partnerName}</strong></span>
    </div>
  );
}
