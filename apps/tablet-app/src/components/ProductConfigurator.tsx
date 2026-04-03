import type { ModifierGroup, Product, SelectedModifier } from "@burger-pos/shared";
import { type SelectionState, isGroupValid } from "@burger-pos/shared";
import { styles } from "../styles";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type ProductConfiguratorProps = {
  canAddCurrentItem: boolean;
  currentItemTotal: number;
  quantity: number;
  selectedGroups: ModifierGroup[];
  selectedModifiers: SelectedModifier[];
  selectedProduct: Product | null;
  selections: SelectionState;
  onAddToCart: () => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onSelectSingleOption: (groupId: string, optionId: string) => void;
  onToggleMultipleOption: (groupId: string, optionId: string) => void;
};

export function ProductConfigurator({
  canAddCurrentItem,
  currentItemTotal,
  quantity,
  selectedGroups,
  selectedModifiers,
  selectedProduct,
  selections,
  onAddToCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onSelectSingleOption,
  onToggleMultipleOption,
}: ProductConfiguratorProps) {
  if (!selectedProduct) {
    return <p style={styles.emptyText}>No hay productos en esta categoria.</p>;
  }

  return (
    <>
      <div style={styles.detailHeader}>
        <div>
          <p style={styles.eyebrow}>Personalizar</p>
          <h2 style={styles.sectionTitle}>{selectedProduct.name}</h2>
        </div>
        <strong>{currencyFormatter.format(selectedProduct.price)}</strong>
      </div>

      <div style={styles.modifierStack}>
        {selectedGroups.map((group) => {
          const selectedIds = selections[group.id] ?? [];
          const hasError = !isGroupValid(group, selectedIds);

          return (
            <div key={group.id} style={styles.groupCard}>
              <div style={styles.groupHeader}>
                <div>
                  <h3 style={styles.groupTitle}>{group.name}</h3>
                  <p style={styles.groupHint}>
                    {group.type === "single"
                      ? group.required
                        ? "Elegi una opcion obligatoria"
                        : "Elegi una opcion"
                      : group.max
                        ? `Podes sumar hasta ${group.max} opciones`
                        : "Podes marcar varias opciones"}
                  </p>
                </div>
                {hasError ? <span style={styles.errorBadge}>Requerido</span> : null}
              </div>
              <div style={styles.optionList}>
                {group.options.map((option) => {
                  const selected = selectedIds.includes(option.id);
                  const optionPrice =
                    option.price > 0 ? `+${currencyFormatter.format(option.price)}` : "Sin cargo";

                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        group.type === "single"
                          ? onSelectSingleOption(group.id, option.id)
                          : onToggleMultipleOption(group.id, option.id)
                      }
                      style={{
                        ...styles.optionButton,
                        ...(selected ? styles.optionButtonActive : {}),
                      }}
                    >
                      <div>
                        <strong>{option.name}</strong>
                        <p style={styles.optionMeta}>
                          {option.isRemovable ? "Activo por defecto, desmarcalo para quitarlo" : optionPrice}
                        </p>
                      </div>
                      <span>{selected ? "Seleccionado" : "Agregar"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.confirmBanner}>
          <strong>Revisa tu eleccion</strong>
          <span>Despues puedes sumar el item al carrito.</span>
        </div>
        <div style={styles.quantityRow}>
          <span style={styles.groupTitle}>Cantidad</span>
          <div style={styles.quantityControl}>
            <button onClick={onDecreaseQuantity} style={styles.qtyButton}>
              -
            </button>
            <span style={styles.quantityValue}>{quantity}</span>
            <button onClick={onIncreaseQuantity} style={styles.qtyButton}>
              +
            </button>
          </div>
        </div>

        <div style={styles.selectedSummary}>
          {selectedModifiers.length > 0 ? (
            selectedModifiers.map((modifier) => (
              <div key={`${modifier.groupId}-${modifier.optionId}`} style={styles.summaryRow}>
                <span>{modifier.optionName}</span>
                <span>{modifier.price > 0 ? currencyFormatter.format(modifier.price) : "Sin cargo"}</span>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>Sin cambios sobre la configuracion base.</p>
          )}
        </div>

        <div style={styles.footerRow}>
          <div>
            <p style={styles.eyebrow}>Total item</p>
            <strong style={styles.totalValue}>{currencyFormatter.format(currentItemTotal)}</strong>
          </div>
          <button
            onClick={onAddToCart}
            disabled={!canAddCurrentItem}
            style={{
              ...styles.addButton,
              ...(!canAddCurrentItem ? styles.addButtonDisabled : {}),
            }}
          >
            Agregar al pedido
          </button>
        </div>
      </div>
    </>
  );
}
