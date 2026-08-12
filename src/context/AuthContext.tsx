"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  adminChecked: false,
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Resultado da última checagem de admin, junto do e-mail a que ele se refere.
  // Guardar o e-mail junto evita "piscar" um resultado antigo (de outro
  // usuário) enquanto a nova assinatura do Firestore ainda não respondeu.
  const [adminSnapshot, setAdminSnapshot] = useState<{ email: string; exists: boolean } | null>(
    null
  );

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email.toLowerCase();
    const ref = doc(db, "admins", email);
    const unsub = onSnapshot(
      ref,
      (snap) => setAdminSnapshot({ email, exists: snap.exists() }),
      () => setAdminSnapshot({ email, exists: false })
    );
    return () => unsub();
  }, [user?.email]);

  const signOutUser = async () => {
    await fbSignOut(auth);
  };

  const currentEmail = user?.email?.toLowerCase();
  const isAdmin =
    Boolean(currentEmail) && adminSnapshot != null && adminSnapshot.email === currentEmail && adminSnapshot.exists;
  const adminChecked = !currentEmail || (adminSnapshot != null && adminSnapshot.email === currentEmail);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, adminChecked, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
