import type { ModifierGroup } from "../types/modifier";
import type { OrderStatus, SelectedModifier } from "../types/order";
import type { Product } from "../types/product";

export type SelectionState = Record<string, string[]>;

export function getModifierGroupsForProduct(product: Product | null, modifierGroups: ModifierGroup[]): ModifierGroup[] {
  if (!product) {
    return [];
  }

  const modifierGroupMap = new Map(modifierGroups.map((group) => [group.id, group]));

  return product.modifierGroupIds
    .map((groupId) => modifierGroupMap.get(groupId))
    .filter((group): group is ModifierGroup => Boolean(group));
}

export function createInitialSelections(product: Product, modifierGroups: ModifierGroup[]): SelectionState {
  const modifierGroupMap = new Map(modifierGroups.map((group) => [group.id, group]));

  return product.modifierGroupIds.reduce<SelectionState>((acc, groupId) => {
    const group = modifierGroupMap.get(groupId);

    if (!group) {
      acc[groupId] = [];
      return acc;
    }

    if (group.type === "single") {
      acc[groupId] = group.required && group.options.length > 0 ? [group.options[0].id] : [];
      return acc;
    }

    acc[groupId] = group.options.filter((option) => option.isRemovable).map((option) => option.id);
    return acc;
  }, {});
}

export function buildSelectedModifiers(groups: ModifierGroup[], selections: SelectionState): SelectedModifier[] {
  return groups.flatMap((group) => {
    const selectedIds = selections[group.id] ?? [];

    return group.options.flatMap((option) => {
      const isSelected = selectedIds.includes(option.id);

      if (option.isRemovable) {
        return isSelected
          ? []
          : [
              {
                groupId: group.id,
                groupName: group.name,
                optionId: option.id,
                optionName: `Sin ${option.name}`,
                price: 0,
              },
            ];
      }

      return isSelected
        ? [
            {
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              price: option.price,
            },
          ]
        : [];
    });
  });
}

export function calculateItemTotal(basePrice: number, modifiers: SelectedModifier[], quantity: number) {
  const modifiersTotal = modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  return (basePrice + modifiersTotal) * quantity;
}

export function isGroupValid(group: ModifierGroup, selectedIds: string[]) {
  if (group.type === "single") {
    return !group.required || selectedIds.length === 1;
  }

  if (group.required && selectedIds.length === 0) {
    return false;
  }

  if (typeof group.min === "number" && selectedIds.length < group.min) {
    return false;
  }

  if (typeof group.max === "number" && selectedIds.length > group.max) {
    return false;
  }

  return true;
}

export function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "preparing":
      return "En preparacion";
    case "ready":
      return "Listo para retirar";
    case "delivered":
      return "Entregado";
    default:
      return status;
  }
}
