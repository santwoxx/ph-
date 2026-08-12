import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppNotification } from "@/lib/types";

const COLLECTION = "notifications";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

function mapNotification(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id,
    customerUid: (data.customerUid as string) ?? "",
    orderId: (data.orderId as string) ?? undefined,
    title: (data.title as string) ?? "",
    message: (data.message as string) ?? "",
    read: (data.read as boolean) ?? false,
    createdAt: toMillis(data.createdAt),
  };
}

export function subscribeToCustomerNotifications(
  uid: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, COLLECTION),
    where("customerUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapNotification(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export async function createNotification(input: {
  customerUid: string;
  orderId?: string;
  title: string;
  message: string;
}) {
  return addDoc(collection(db, COLLECTION), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(id: string) {
  return updateDoc(doc(db, COLLECTION, id), { read: true });
}

export async function markAllNotificationsRead(notifications: AppNotification[]) {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, COLLECTION, n.id), { read: true }));
  return batch.commit();
}
