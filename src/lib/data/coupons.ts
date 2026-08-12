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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coupon } from "@/lib/types";

export function subscribeToCoupons(
  onUpdate: (coupons: Coupon[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map((d) => {
        const item = d.data();
        return {
          id: d.id,
          type: item.type,
          value: item.value,
          minOrder: item.minOrder,
          active: item.active,
          createdAt: item.createdAt?.toMillis() || Date.now(),
        } as Coupon;
      });
      onUpdate(data);
    },
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

  const data = snap.data();
  return {
    id: snap.id,
    type: data.type,
    value: data.value,
    minOrder: data.minOrder,
    active: data.active,
    createdAt: data.createdAt?.toMillis() || Date.now(),
  } as Coupon;
}

export async function createCoupon(coupon: Omit<Coupon, "createdAt">) {
  const codeUpper = coupon.id.toUpperCase().trim();
  const ref = doc(db, "coupons", codeUpper);
  await setDoc(ref, {
    ...coupon,
    id: codeUpper,
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
