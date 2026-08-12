export type ProductSize = {
  label: string;
  price: number;
};

export type ProductExtra = {
  name: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  imagePath?: string;
  basePrice: number;
  sizes: ProductSize[];
  extras: ProductExtra[];
  available: boolean;
  featured: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export type PaymentMethod = "pix" | "dinheiro" | "cartao";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão (na entrega)",
};

export type DeliveryType = "delivery" | "pickup";

export type OrderItem = {
  productId: string;
  name: string;
  size: string;
  unitPrice: number;
  qty: number;
  extras: ProductExtra[];
  notes?: string;
  lineTotal: number;
};

export type OrderAddress = {
  street: string;
  number: string;
  district: string;
  city: string;
  complement?: string;
  reference?: string;
};

export type Order = {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryType: DeliveryType;
  address: OrderAddress | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  changeFor?: number | null;
  status: OrderStatus;
  notes?: string;
  rating?: number;
  feedback?: string;
  scheduledTo?: string;
  createdAt: number;
  updatedAt: number;
};

export type Coupon = {
  id: string; // código, ex: BEMVINDO10
  type: "fixed" | "percentage";
  value: number;
  minOrder?: number;
  active: boolean;
  createdAt: number;
};

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt: number;
  createdBy: string;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  whatsapp: string;
  instagram?: string;
  address: string;
  openingHours: string;
  deliveryFee: number;
  minOrder: number;
  isOpen: boolean;
  categories: string[];
  pixKey?: string;
  monthlyGoal?: number;
};

// Aviso que o admin dispara (hoje, automaticamente ao mudar o status de um
// pedido) e que aparece no sininho de notificações do cliente.
export type AppNotification = {
  id: string;
  customerUid: string;
  orderId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  addresses?: (OrderAddress & { tag: string })[];
  createdAt: number;
};
