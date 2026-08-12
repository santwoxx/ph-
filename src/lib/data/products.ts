import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";

const COLLECTION = "products";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

export function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: (data.name as string) ?? "",
    description: (data.description as string) ?? "",
    category: (data.category as string) ?? "Outros",
    imageUrl: (data.imageUrl as string) ?? "",
    imagePath: (data.imagePath as string) ?? "",
    basePrice: (data.basePrice as number) ?? 0,
    sizes: (data.sizes as Product["sizes"]) ?? [],
    extras: (data.extras as Product["extras"]) ?? [],
    available: (data.available as boolean) ?? true,
    featured: (data.featured as boolean) ?? false,
    order: (data.order as number) ?? 0,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapProduct(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export type ProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;

export async function createProduct(input: ProductInput) {
  return addDoc(collection(db, COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}
