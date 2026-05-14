import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, getDoc } from '../lib/firebase';
import { AuthorityUser } from '../types';

interface AuthContextType {
  user: User | null;
  authorityProfile: AuthorityUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authorityProfile, setAuthorityProfile] = useState<AuthorityUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch authority profile if it exists
        try {
          const profileDoc = await getDoc(doc(db, 'authority_users', user.uid));
          if (profileDoc.exists()) {
            setAuthorityProfile(profileDoc.data() as AuthorityUser);
          } else {
            setAuthorityProfile(null);
          }
        } catch (error) {
          console.error("Error fetching authority profile:", error);
          setAuthorityProfile(null);
        }
      } else {
        setAuthorityProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, authorityProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
