import type { ModifierGroup, OrderItem, Product } from "@burger-pos/shared";
import type { DraftCartItem } from "../types";
import { currencyFormatter, isGroupValid, type SelectionState } from "../lib/order-ui";
import { styles } from "../styles";

type ManualOrderPanelProps = {
  canAddManualItem: boolean;
  products: Product[];
  currentManualItemTotal: number;
  draftItems: DraftCartItem[];
  draftTotal: number;
  isSubmittingManualOrder: boolean;
  manualMessage: string | null;
  manualTableId: string;
  selectedGroups: ModifierGroup[];
  selectedProduct: Product | null;
  selectedProductId: string;
  selectedQuantity: number;
  selections: SelectionState;
  onAddDraftItem: () => void;
  onRemoveDraftItem: (itemId: string) => void;
  onSelectProduct: (productId: string) => void;
  onSelectSingleOption: (groupId: string, optionId: string) => void;
  onSetManualTableId: (value: string) => void;
  onSetSelectedQuantity: (value: number) => void;
  onSubmitManualOrder: () => void;
  onToggleMultipleOption: (groupId: string, optionId: string) => void;
};

export function ManualOrderPanel({
  canAddManualItem,
  products,
  currentManualItemTotal,
  draftItems,
  draftTotal,
  isSubmittingManualOrder,
  manualMessage,
  manualTableId,
  selectedGroups,
  selectedProduct,
  selectedProductId,
  selectedQuantity,
  selections,
  onAddDraftItem,
  onRemoveDraftItem,
  onSelectProduct,
  onSelectSingleOption,
  onSetManualTableId,
  onSetSelectedQuantity,
  onSubmitManualOrder,
  onToggleMultipleOption,
}: ManualOrderPanelProps) {
  return (
    <section style={styles.manualSection}>
      <article style={styles.settingsCard}>
        <p style={styles.eyebrow}>Carga manual</p>
        <h2 style={styles.sectionTitle}>Nuevo pedido desde caja</h2>

        <label style={styles.label}>
          Mesa o origen
          <input
            value={manualTableId}
            onChange={(event) => onSetManualTableId(event.target.value)}
            style={styles.input}
            placeholder="Ej: 7 o caja"
          />
        </label>

        <div style={styles.inlineFields}>
          <label style={styles.label}>
            Producto
            <select value={selectedProductId} onChange={(event) => onSelectProduct(event.target.value)} style={styles.input}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Cantidad
            <input
              type="number"
              min={1}
              value={selectedQuantity}
              onChange={(event) => onSetSelectedQuantity(Math.max(1, Number(event.target.value) || 1))}
              style={styles.input}
            />
          </label>
        </div>

        {selectedProduct ? (
          <div style={styles.configuratorCard}>
            <div style={styles.row}>
              <strong>{selectedProduct.name}</strong>
              <strong>{currencyFormatter.format(selectedProduct.price)}</strong>
            </div>
            {selectedGroups.length === 0 ? (
              <p style={styles.emptyText}>Este producto no tiene modificadores.</p>
            ) : (
              <div style={styles.optionGroups}>
                {selectedGroups.map((group) => {
                  const selectedIds = selections[group.id] ?? [];
                  const invalid = !isGroupValid(group, selectedIds);

                  return (
                    <div key={group.id} style={styles.optionGroupCard}>
                      <div style={styles.groupHeader}>
                        <strong>{group.name}</strong>
                        {invalid ? <span style={styles.errorBadge}>Requerido</span> : null}
                      </div>
                      <div style={styles.optionList}>
                        {group.options.map((option) => {
                          const active = selectedIds.includes(option.id);

                          return (
                            <button
                              key={option.id}
                              onClick={() =>
                                group.type === "single"
                                  ? onSelectSingleOption(group.id, option.id)
                                  : onToggleMultipleOption(group.id, option.id)
                              }
                              style={{ ...styles.optionButton, ...(active ? styles.optionButtonActive : {}) }}
                            >
                              <div>
                                <strong>{option.name}</strong>
                                <div style={styles.modifierText}>
                                  {option.isRemovable
                                    ? "Incluido por defecto"
                                    : option.price > 0
                                      ? `+${currencyFormatter.format(option.price)}`
                                      : "Sin cargo"}
                                </div>
                              </div>
                              <span>{active ? "Seleccionado" : "Agregar"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.footer}>
              <div>
                <p style={styles.eyebrow}>Total item</p>
                <strong style={styles.totalValue}>{currencyFormatter.format(currentManualItemTotal)}</strong>
              </div>
              <button
                onClick={onAddDraftItem}
                disabled={!canAddManualItem}
                style={{ ...styles.secondaryButton, ...(!canAddManualItem ? styles.buttonDisabled : {}) }}
              >
                Agregar item
              </button>
            </div>
          </div>
        ) : null}

        <div style={styles.draftList}>
          {draftItems.length === 0 ? (
            <p style={styles.emptyText}>Todavia no agregaste items al pedido manual.</p>
          ) : (
            draftItems.map(({ item }) => (
              <div key={item.id} style={styles.draftItem}>
                <div>
                  <strong>{item.quantity} x {item.productName}</strong>
                  <div style={styles.modifierText}>{currencyFormatter.format(item.total)}</div>
                  {item.modifiers.map((modifier) => (
                    <div key={`${item.id}-${modifier.groupId}-${modifier.optionId}`} style={styles.modifierText}>
                      {modifier.optionName}
                    </div>
                  ))}
                </div>
                <button onClick={() => onRemoveDraftItem(item.id)} style={styles.removeButton}>
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <div>
            <p style={styles.eyebrow}>Total manual</p>
            <strong style={styles.totalValue}>{currencyFormatter.format(draftTotal)}</strong>
          </div>
          <button
            onClick={onSubmitManualOrder}
            disabled={draftItems.length === 0 || isSubmittingManualOrder}
            style={{
              ...styles.actionButton,
              ...(draftItems.length === 0 || isSubmittingManualOrder ? styles.buttonDisabled : {}),
            }}
          >
            {isSubmittingManualOrder ? "Guardando..." : "Cargar pedido"}
          </button>
        </div>
        {manualMessage ? <p style={styles.successText}>{manualMessage}</p> : null}
      </article>
    </section>
  );
}
