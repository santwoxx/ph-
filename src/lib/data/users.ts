import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

export async function ensureUserProfile(
  uid: string,
  data: { name: string; email: string; phone?: string }
) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    createdAt: Date.now(),
  };
}

export async function updateUserProfile(
  uid: string,
  data: Partial<{ name: string; phone: string }>
) {
  return setDoc(doc(db, "users", uid), data, { merge: true });
}
