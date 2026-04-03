import type { OrderItem, OrderSource, OrderStatus } from "@burger-pos/shared";

export type DailySummary = {
  businessDay: string;
  orderCount: number;
  totalRevenue: number;
  byStatus: Record<OrderStatus, number>;
  bySource: Record<OrderSource, number>;
};

export type DraftCartItem = {
  item: OrderItem;
};
