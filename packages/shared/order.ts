export type OrderStatus = "pending" | "preparing" | "ready";

export type Order = {
  id: string;
  tableId: string;
  status: OrderStatus;
};