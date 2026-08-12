import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadProductImage(
  productId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `products/${productId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function uploadSettingsImage(
  kind: "logo" | "banner",
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `settings/${kind}-${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteImageByPath(path: string) {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // se já não existir, ignora
  }
}
