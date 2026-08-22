'use client';
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, User as FirebaseUser, signOut, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { isPast } from 'date-fns';
import { checkExistingUserByEmail } from '@/app/actions';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<User | 'invalid_role' | 'invalid_credentials' | 'subscription_lapsed' | 'account_deactivated' | undefined>;
  reauthenticate: (firebaseUser: FirebaseUser) => Promise<User | 'invalid_credentials' | 'subscription_lapsed' | 'account_deactivated' | undefined>;
  logout: () => void;
  signup: (values: { name: string; surname: string; cellNumber: string; email: string; password?: string }) => Promise<User | string>;
  /** Links historical guest orders once the signed-in address is verified. Returns how many. */
  claimVerifiedGuestOrders: () => Promise<number>;
  updateUser: (updatedUser: User | null) => void;
  isAuthenticated: boolean | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            if (user && firebaseUser.uid === user.uid) {
                if (user.isActive === false) {
                    await signOut(auth);
                    updateUser(null);
                    setIsAuthenticated(false);
                    return;
                }
                if (isAuthenticated === false) setIsAuthenticated(true);
                return;
            }
            await reauthenticate(firebaseUser);
        } else {
            updateUser(null);
            setIsAuthenticated(false);
        }
    });

    return () => unsubscribe();
  }, []);
  
  const updateUser = (updatedUser: User | null) => {
    setUser(updatedUser);
  }

  const login = async (email: string, password?: string): Promise<User | 'invalid_role' | 'invalid_credentials' | 'subscription_lapsed' | 'account_deactivated' | undefined> => {
    if (!password) return 'invalid_credentials';
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return await reauthenticate(userCredential.user);
    } catch (error: any) {
        if (error.code === 'auth/user-disabled') {
             return 'account_deactivated';
        }
        const expectedAuthErrors = [
          'auth/user-not-found', 
          'auth/wrong-password', 
          'wrong-password', 
          'auth/invalid-credential',
          'auth/invalid-email'
        ];
        if (error.code && !expectedAuthErrors.includes(error.code) && error.code !== 'permission-denied') { 
             console.error("Error logging in:", error.code, error.message);
        }

        if (expectedAuthErrors.includes(error.code)) {
             return 'invalid_credentials';
        }
        return undefined;
    }
  };

  const reauthenticate = async (firebaseUser: FirebaseUser): Promise<User | 'invalid_credentials' | 'subscription_lapsed' | 'account_deactivated' | undefined> => {
        if (!firebaseUser.email) return 'invalid_credentials';
        
        try {
            const collectionsToTry = ['users', 'aiAccountantClients', 'adminClients', 'partnerClients'];
            
            // Execute queries in parallel to eliminate waterfall latency
            const promises = collectionsToTry.map(async (collectionName) => {
                const userDocRef = doc(db, collectionName, firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    return { ...userDocSnap.data(), id: userDocSnap.id, uid: userDocSnap.id } as User;
                }
                return null;
            });
            
            const results = await Promise.all(promises);
            const foundUser = results.find((user) => user !== null) || null;

            if (foundUser) {
                if (foundUser.isActive === false) {
                    await signOut(auth);
                    updateUser(null);
                    setIsAuthenticated(false);
                    return 'account_deactivated';
                }
                if (foundUser.source === 'AI Accountant' && foundUser.subscription) {
                    const rawEndDate = (foundUser.subscription as any).subscriptionEndDate;
                    let endDate: Date | null = null;
                    if (rawEndDate?.toDate) {
                        endDate = rawEndDate.toDate();
                    } else if (rawEndDate instanceof Date) {
                        endDate = rawEndDate;
                    } else if (typeof rawEndDate === 'string') {
                        endDate = new Date(rawEndDate);
                    }
                    if (endDate && isPast(endDate) && foundUser.subscription.subscriptionStatus !== 'active') {
                        setUser(foundUser); 
                        return 'subscription_lapsed';
                    }
                }
                 updateUser(foundUser);
                 setIsAuthenticated(true);
                 return foundUser;
            } else {
                // Patient handling during signup: if the doc isn't found, 
                // we don't sign out immediately. We allow the app to be "Authenticated" 
                // but without a profile for a short period while the doc is being created.
                console.warn(`User document not found for UID: ${firebaseUser.uid} in any collection. Still authenticated via Firebase Auth.`);
                updateUser(null);
                setIsAuthenticated(true);
                return undefined;
            }

        } catch (serverError: any) {
            if (serverError.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: `users/${firebaseUser.uid}`,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
             console.error("Error re-authenticating:", serverError);
             return undefined;
        }
  }

  const logout = () => {
    signOut(auth);
    updateUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Links historical guest orders to the signed-in account, but only once Firebase reports the
   * address as verified. Safe to call repeatedly — it only touches orders with no owner yet.
   */
  const claimVerifiedGuestOrders = async (): Promise<number> => {
    const current = auth.currentUser;
    if (!current?.email) return 0;

    await current.reload();
    if (!current.emailVerified) return 0;

    const ordersRef = collection(db, "orders");
    const batch = writeBatch(db);
    let linkCount = 0;

    for (const field of ["customerEmail", "endCustomerEmail"]) {
      const q = query(ordersRef, where(field, "==", current.email), where("userId", "==", null));
      const snap = await getDocs(q);
      snap.forEach(orderDoc => {
        batch.update(orderDoc.ref, { userId: current.uid });
        linkCount++;
      });
    }

    if (linkCount > 0) await batch.commit();
    return linkCount;
  };

  const signup = async (values: { name: string; surname: string; cellNumber: string; email: string; password?: string }): Promise<User | string> => {
    if (!values.password) return 'Password is required.';

    try {
        const checkResult = await checkExistingUserByEmail(values.email);
        if (checkResult.exists) {
            return 'An account with this email already exists.';
        }

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const firebaseUser = userCredential.user;

        const newUserDocRef = doc(db, "users", firebaseUser.uid);
        const newUser: User = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: `${values.name} ${values.surname}`,
            email: values.email,
            contactNumber: values.cellNumber,
            role: 'client',
            createdAt: serverTimestamp(),
        };

        await setDoc(newUserDocRef, newUser);
        updateUser(newUser);
        setIsAuthenticated(true);

        // The application had no email verification at all, while Firestore rules grant order
        // access on `request.auth.token.email`. Registering with someone else's email therefore
        // handed you their orders. Send the verification mail so the token carries a trustworthy
        // email_verified claim; failure here must not block account creation.
        try {
            await sendEmailVerification(firebaseUser);
        } catch (verifyErr) {
            console.error('Could not send verification email:', verifyErr);
        }

        // Historical guest orders are NO LONGER auto-claimed on signup.
        //
        // This previously ran immediately on registration and assigned `userId` to every order
        // matching the address — before the address had been proven to belong to the registrant.
        // Anyone could register with a known customer's email and silently take ownership of that
        // customer's orders and their uploaded KYC documents. Claiming now happens only after the
        // address is verified (see claimVerifiedGuestOrders below).

        return newUser;
    } catch (error: any) {
        console.error("Error signing up:", error);
        if (error.code === 'auth/email-already-in-use') {
            return 'An account with this email already exists in our authentication system, but not in our database. Please contact support.';
        }
        return 'An unexpected error occurred during signup.';
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, reauthenticate, logout, signup, updateUser, isAuthenticated, claimVerifiedGuestOrders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  if(isAuthenticated === false) return null;
  if(isAuthenticated === true) return <>{children}</>;
  return null;
}
