import type { Category } from "./category";
import type { ModifierGroup } from "./modifier";
import type { Product } from "./product";

export type MenuCatalog = {
  categories: Category[];
  modifierGroups: ModifierGroup[];
  products: Product[];
};
