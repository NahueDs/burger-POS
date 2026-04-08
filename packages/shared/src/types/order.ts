export type OrderStatus = "pending" | "preparing" | "ready" | "delivered";
export type OrderSource = "tablet" | "pos";

export type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  basePrice: number;
  modifiers: SelectedModifier[];
  quantity: number;
  total: number;
};

export type CreateOrderInput = {
  tableId: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone?: string;
  source?: OrderSource;
};

export type Order = {
  id: string;
  tableId: string;
  customerName: string;
  customerPhone?: string;
  source: OrderSource;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
};
