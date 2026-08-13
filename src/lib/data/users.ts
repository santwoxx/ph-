import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

export function mapUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    cpf: (data.cpf as string) ?? "",
    addresses: (data.addresses as UserProfile["addresses"]) ?? [],
    createdAt: toMillis(data.createdAt),
  };
}

// Chamado logo após o login com Google. Só cria o documento na primeira vez
// (quem já tem perfil não é sobrescrito) — o retorno diz pro chamador se
// era um usuário novo, pra decidir se mostra o formulário de cadastro.
export async function ensureUserProfile(
  uid: string,
  data: { name: string; email: string; phone?: string }
): Promise<{ created: boolean }> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      createdAt: serverTimestamp(),
    });
    return { created: true };
  }
  return { created: false };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return mapUserProfile(uid, snap.data());
}

// Usado pelo painel admin (tela "Clientes") — lista todo mundo que já
// logou, com os dados preenchidos no primeiro acesso.
export function subscribeToAllUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapUserProfile(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export async function updateUserProfile(
  uid: string,
  data: Partial<{ name: string; phone: string; cpf: string; addresses: UserProfile["addresses"] }>
) {
  return setDoc(doc(db, "users", uid), data, { merge: true });
}
