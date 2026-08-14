import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
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

// `sinceDate` ("YYYY-MM-DD") é opcional — sem ele, busca todo o histórico
// de despesas, como antes. Dashboard e Finanças só usam o mês/últimos
// meses, então passam essa data pra não baixar despesas antigas à toa.
export function subscribeToExpenses(
  onData: (expenses: Expense[]) => void,
  onError?: (error: Error) => void,
  options?: { sinceDate?: string }
) {
  const clauses: QueryConstraint[] = [];
  if (options?.sinceDate) {
    clauses.push(where("date", ">=", options.sinceDate));
  }
  clauses.push(orderBy("date", "desc"));
  const q = query(collection(db, COLLECTION), ...clauses);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapExpense(d.id, d.data()))),
    (err) => onError?.(err)
  );
}
