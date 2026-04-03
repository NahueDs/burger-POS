export type ModifierOption = {
  id: string;
  name: string;
  price: number;
  isRemovable?: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  min?: number;
  max?: number;
  options: ModifierOption[];
};
