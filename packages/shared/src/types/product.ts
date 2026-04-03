export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  modifierGroupIds: string[];
};
