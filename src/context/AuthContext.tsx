"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { ensureUserProfile, mapUserProfile } from "@/lib/data/users";
import type { UserProfile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  // Perfil existe mas ainda falta CPF ou endereço — mostra o modal de
  // cadastro, sem nunca travar a navegação (quem decide fechar é o modal).
  needsProfileCompletion: boolean;
  signInWithGoogle: () => Promise<User>;
  // Autentica um visitante sem exigir login — usado no checkout pra quem
  // quer fazer um pedido sem criar conta. Gera um usuário anônimo do
  // Firebase (mesmo uid enquanto ele não limpar os dados do navegador),
  // o suficiente pra satisfazer as regras do Firestore que exigem
  // `request.auth != null`.
  signInAsGuest: () => Promise<User>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  adminChecked: false,
  needsProfileCompletion: false,
  signInWithGoogle: async () => {
    throw new Error("AuthProvider ausente");
  },
  signInAsGuest: async () => {
    throw new Error("AuthProvider ausente");
  },
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
  const [profileSnapshot, setProfileSnapshot] = useState<{ uid: string; profile: UserProfile | null } | null>(
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

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => setProfileSnapshot({ uid, profile: snap.exists() ? mapUserProfile(uid, snap.data()) : null }),
      () => setProfileSnapshot({ uid, profile: null })
    );
    return () => unsub();
  }, [user]);

  const signInWithGoogle = async () => {
    const current = auth.currentUser;
    let cred;
    if (current?.isAnonymous) {
      // Cliente já tinha feito um pedido como visitante nesta sessão: linka
      // a conta Google à mesma conta anônima pra não perder o histórico de
      // pedidos que já ficaram salvos com aquele uid.
      try {
        cred = await linkWithPopup(current, googleProvider);
      } catch (err) {
        const code = (err as { code?: string })?.code;
        // Essa conta Google já existe vinculada a outro usuário — não dá
        // pra linkar (o Firebase não permite), então cai pro login normal
        // nela. Perde-se o vínculo com os pedidos feitos como visitante,
        // mas é o único jeito de continuar.
        if (code === "auth/credential-already-in-use" || code === "auth/email-already-in-use") {
          cred = await signInWithPopup(auth, googleProvider);
        } else {
          throw err;
        }
      }
    } else {
      cred = await signInWithPopup(auth, googleProvider);
    }
    await ensureUserProfile(cred.user.uid, {
      name: cred.user.displayName || "",
      email: cred.user.email || "",
    });
    return cred.user;
  };

  const signInAsGuest = async () => {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  };

  const signOutUser = async () => {
    await fbSignOut(auth);
  };

  const currentEmail = user?.email?.toLowerCase();
  const isAdmin =
    Boolean(currentEmail) && adminSnapshot != null && adminSnapshot.email === currentEmail && adminSnapshot.exists;
  const adminChecked = !currentEmail || (adminSnapshot != null && adminSnapshot.email === currentEmail);

  const profile = user && profileSnapshot?.uid === user.uid ? profileSnapshot.profile : null;
  const profileChecked = !user || profileSnapshot?.uid === user.uid;
  // Visitante anônimo (checkout sem login) nunca vê o modal de completar
  // cadastro — pedir CPF pra quem só quis pedir sem criar conta reintroduz
  // a fricção que o checkout como visitante existe pra evitar.
  const needsProfileCompletion =
    Boolean(user) &&
    !user!.isAnonymous &&
    profileChecked &&
    (!profile || !profile.cpf || !profile.phone || !profile.addresses?.length);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        adminChecked,
        needsProfileCompletion,
        signInWithGoogle,
        signInAsGuest,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
