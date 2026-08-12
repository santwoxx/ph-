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
    rating: data.rating as number | undefined,
    feedback: data.feedback as string | undefined,
    scheduledTo: data.scheduledTo as string | undefined,
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

const STATUS_NOTIFICATION: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  confirmed: {
    title: "Pedido confirmado! 🎉",
    message: "Já recebemos seu pedido e vamos começar a preparar.",
  },
  preparing: {
    title: "Preparando seu pedido 🍇",
    message: "Seu açaí está sendo preparado com carinho.",
  },
  out_for_delivery: {
    title: "Saiu para entrega! 🛵",
    message: "Seu pedido está a caminho.",
  },
  delivered: {
    title: "Pedido entregue ✅",
    message: "Aproveite seu açaí! Bom apetite.",
  },
  cancelled: {
    title: "Pedido cancelado",
    message: "Seu pedido foi cancelado. Qualquer dúvida, fale com a loja.",
  },
};

// Quem decide mudar o status é sempre o admin, pelo painel. Cada mudança
// já gera automaticamente uma notificação para o cliente dono do pedido
// (ele vê no sininho do próprio painel) — um único batch garante que o
// status e o aviso ficam consistentes entre si.
export async function updateOrderStatus(order: Order, status: OrderStatus) {
  const batch = writeBatch(db);

  batch.update(doc(db, COLLECTION, order.id), {
    status,
    updatedAt: serverTimestamp(),
  });

  const notice = STATUS_NOTIFICATION[status];
  if (notice) {
    batch.set(doc(collection(db, "notifications")), {
      customerUid: order.customerUid,
      orderId: order.id,
      title: notice.title,
      message: notice.message,
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  return batch.commit();
}

export async function updateOrder(id: string, data: Partial<Order>) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
