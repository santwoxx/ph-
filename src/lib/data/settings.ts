import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StoreSettings } from "@/lib/types";

const DOC_PATH = ["settings", "store"] as const;

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Açaí do PH",
  tagline: "O melhor açaí da região, aberto até meia-noite!",
  logoUrl: "",
  bannerUrl: "",
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP || "",
  instagram: "acaidoph__",
  address: "",
  openingHours: "Todos os dias, 12h às 22h",
  deliveryFee: 6,
  minOrder: 15,
  isOpen: true,
  isAutoOpen: false,
  schedule: {
    "0": { active: true, start: "18:00", end: "23:59" },
    "1": { active: true, start: "18:00", end: "23:59" },
    "2": { active: true, start: "18:00", end: "23:59" },
    "3": { active: true, start: "18:00", end: "23:59" },
    "4": { active: true, start: "18:00", end: "23:59" },
    "5": { active: true, start: "18:00", end: "23:59" },
    "6": { active: true, start: "18:00", end: "23:59" },
  },
  categories: ["Açaí", "Combos", "Adicionais", "Bebidas", "Sobremesas"],
  pixKey: "",
  monthlyGoal: 0,
  neighborhoods: [],
};

export async function getSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(db, ...DOC_PATH));
  if (!snap.exists()) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<StoreSettings>) };
}

export function subscribeToSettings(
  onData: (settings: StoreSettings) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, ...DOC_PATH),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_SETTINGS);
        return;
      }
      onData({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<StoreSettings>) });
    },
    (err) => onError?.(err)
  );
}

export async function saveSettings(settings: Partial<StoreSettings>) {
  return setDoc(doc(db, ...DOC_PATH), settings, { merge: true });
}
