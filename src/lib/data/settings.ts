import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StoreSettings } from "@/lib/types";

const DOC_PATH = ["settings", "store"] as const;

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Açaí do Bairro",
  tagline: "O açaí mais cremoso da cidade, na porta da sua casa",
  logoUrl: "",
  bannerUrl: "",
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP || "",
  instagram: "",
  address: "",
  openingHours: "Todos os dias, 12h às 22h",
  deliveryFee: 6,
  minOrder: 15,
  isOpen: true,
  categories: ["Açaí", "Combos", "Adicionais", "Bebidas", "Sobremesas"],
  pixKey: "",
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
