import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION = "admins";

export async function checkIsAdmin(email: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COLLECTION, email.toLowerCase()));
  return snap.exists();
}

export type AdminEntry = { email: string; addedAt: string; addedBy: string };

export function subscribeToAdmins(
  onData: (admins: AdminEntry[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            email: d.id,
            addedAt: (data.addedAt as string) ?? "",
            addedBy: (data.addedBy as string) ?? "",
          };
        })
      ),
    (err) => onError?.(err)
  );
}

export async function addAdmin(email: string, addedBy: string) {
  const normalized = email.trim().toLowerCase();
  return setDoc(doc(db, COLLECTION, normalized), {
    email: normalized,
    addedAt: new Date().toISOString(),
    addedBy,
  });
}

export async function removeAdmin(email: string) {
  return deleteDoc(doc(db, COLLECTION, email.toLowerCase()));
}
