import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Expense } from "@/lib/types";

const COLLECTION = "expenses";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

function mapExpense(id: string, data: Record<string, unknown>): Expense {
  return {
    id,
    description: (data.description as string) ?? "",
    category: (data.category as string) ?? "Outros",
    amount: (data.amount as number) ?? 0,
    date: (data.date as string) ?? "",
    createdAt: toMillis(data.createdAt),
    createdBy: (data.createdBy as string) ?? "",
  };
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export async function createExpense(input: ExpenseInput) {
  return addDoc(collection(db, COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function deleteExpense(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

export function subscribeToExpenses(
  onData: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapExpense(d.id, d.data()))),
    (err) => onError?.(err)
  );
}
