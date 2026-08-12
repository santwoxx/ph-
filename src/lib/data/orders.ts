import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/lib/types";

const COLLECTION = "orders";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

export function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    customerUid: (data.customerUid as string) ?? "",
    customerName: (data.customerName as string) ?? "",
    customerPhone: (data.customerPhone as string) ?? "",
    customerEmail: (data.customerEmail as string) ?? "",
    deliveryType: (data.deliveryType as Order["deliveryType"]) ?? "delivery",
    address: (data.address as Order["address"]) ?? null,
    items: (data.items as Order["items"]) ?? [],
    subtotal: (data.subtotal as number) ?? 0,
    deliveryFee: (data.deliveryFee as number) ?? 0,
    discount: (data.discount as number) ?? 0,
    total: (data.total as number) ?? 0,
    paymentMethod: (data.paymentMethod as Order["paymentMethod"]) ?? "pix",
    changeFor: (data.changeFor as number | null) ?? null,
    status: (data.status as OrderStatus) ?? "pending",
    notes: (data.notes as string) ?? "",
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export type OrderInput = Omit<Order, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: OrderStatus;
};

export async function createOrder(input: OrderInput) {
  return addDoc(collection(db, COLLECTION), {
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToAllOrders(
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapOrder(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export function subscribeToCustomerOrders(
  uid: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, COLLECTION),
    where("customerUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapOrder(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return updateDoc(doc(db, COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}
