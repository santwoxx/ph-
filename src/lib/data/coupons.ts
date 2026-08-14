import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coupon } from "@/lib/types";

function mapCoupon(id: string, data: Record<string, unknown>): Coupon {
  return {
    id,
    type: data.type as Coupon["type"],
    value: data.value as number,
    minOrder: data.minOrder as number | undefined,
    active: data.active as boolean,
    maxUses: data.maxUses as number | undefined,
    usedCount: (data.usedCount as number | undefined) ?? 0,
    expiresAt: data.expiresAt as string | undefined,
    createdAt: (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? Date.now(),
  };
}

export function subscribeToCoupons(
  onUpdate: (coupons: Coupon[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onUpdate(snap.docs.map((d) => mapCoupon(d.id, d.data()))),
    (err) => {
      console.error(err);
      if (onError) onError(err);
    }
  );
}

export async function getCoupon(code: string): Promise<Coupon | null> {
  const codeUpper = code.toUpperCase().trim();
  const ref = doc(db, "coupons", codeUpper);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapCoupon(snap.id, snap.data());
}

export async function createCoupon(coupon: Omit<Coupon, "createdAt" | "usedCount">) {
  const codeUpper = coupon.id.toUpperCase().trim();
  const ref = doc(db, "coupons", codeUpper);
  await setDoc(ref, {
    ...coupon,
    id: codeUpper,
    usedCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function toggleCouponActive(id: string, active: boolean) {
  const ref = doc(db, "coupons", id);
  await setDoc(ref, { active }, { merge: true });
}

export async function deleteCoupon(id: string) {
  await deleteDoc(doc(db, "coupons", id));
}

// Chamado pelo checkout depois que o pedido já foi criado com sucesso, pra
// contar o uso do cupom. Regra do Firestore garante que isso só incrementa
// exatamente 1 por vez, nunca passa do limite e nunca em cupom inativo — é
// "best effort" de propósito: se falhar, não desfazemos o pedido por causa
// disso, só perdemos a contagem daquele uso específico.
export async function redeemCoupon(id: string) {
  await setDoc(doc(db, "coupons", id), { usedCount: increment(1) }, { merge: true });
}
