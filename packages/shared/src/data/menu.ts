import type { MenuCatalog } from "../types/catalog";
import type { Category } from "../types/category";
import type { ModifierGroup, ModifierOption } from "../types/modifier";
import type { Product } from "../types/product";

export const categories: Category[] = [
  { id: "burgers", name: "Hamburguesas" },
  { id: "drinks", name: "Bebidas" },
  { id: "extras", name: "Extras" },
];

const removableOption = (id: string, name: string): ModifierOption => ({
  id,
  name,
  price: 0,
  isRemovable: true,
});

export const modifierGroups: ModifierGroup[] = [
  {
    id: "classic-base",
    name: "Ingredientes base",
    type: "multiple",
    required: false,
    options: [
      removableOption("lettuce", "Lechuga"),
      removableOption("tomato", "Tomate"),
      removableOption("onion", "Cebolla"),
    ],
  },
  {
    id: "burger-extras",
    name: "Extras",
    type: "multiple",
    required: false,
    max: 3,
    options: [
      { id: "extra-cheddar", name: "Cheddar extra", price: 800 },
      { id: "extra-bacon", name: "Bacon", price: 1200 },
      { id: "double-meat", name: "Doble carne", price: 1800 },
    ],
  },
  {
    id: "bread-type",
    name: "Tipo de pan",
    type: "single",
    required: true,
    options: [
      { id: "brioche", name: "Brioche", price: 0 },
      { id: "classic-bread", name: "Clasico", price: 0 },
    ],
  },
  {
    id: "drink-size",
    name: "Tamano",
    type: "single",
    required: true,
    options: [
      { id: "size-350", name: "350 ml", price: 0 },
      { id: "size-500", name: "500 ml", price: 700 },
    ],
  },
];

export const products: Product[] = [
  {
    id: "burger-classic",
    name: "Burger Clasica",
    description: "Carne, cheddar, vegetales frescos y salsa de la casa.",
    price: 5000,
    categoryId: "burgers",
    modifierGroupIds: ["classic-base", "burger-extras", "bread-type"],
  },
  {
    id: "burger-smash",
    name: "Burger Smash",
    description: "Doble medallon smash, pepinillos y salsa burger.",
    price: 6200,
    categoryId: "burgers",
    modifierGroupIds: ["burger-extras", "bread-type"],
  },
  {
    id: "cola",
    name: "Gaseosa Cola",
    description: "Linea clasica bien fria.",
    price: 2200,
    categoryId: "drinks",
    modifierGroupIds: ["drink-size"],
  },
  {
    id: "fries",
    name: "Papas fritas",
    description: "Porcion crocante para compartir.",
    price: 2800,
    categoryId: "extras",
    modifierGroupIds: [],
  },
];

export const defaultCatalog: MenuCatalog = {
  categories,
  modifierGroups,
  products,
};
