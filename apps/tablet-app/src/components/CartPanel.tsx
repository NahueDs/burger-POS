import { getOrderStatusLabel, type Order, type OrderItem, type OrderStatus, type PublicAppSettings } from "@burger-pos/shared";
import { styles } from "../styles";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type CartPanelProps = {
  cartItems: OrderItem[];
  cartTotal: number;
  customerName: string;
  customerPhone: string;
  canSubmitOrder: boolean;
  isSubmittingOrder: boolean;
  lastSubmittedOrder: Order | null;
  settings: PublicAppSettings;
  submitMessage: string | null;
  trackedOrderStatus: OrderStatus | null;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onRemoveCartItem: (itemId: string) => void;
  onSubmitOrder: () => void;
};

export function CartPanel({
  cartItems,
  cartTotal,
  customerName,
  customerPhone,
  canSubmitOrder,
  isSubmittingOrder,
  lastSubmittedOrder,
  settings,
  submitMessage,
  trackedOrderStatus,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onRemoveCartItem,
  onSubmitOrder,
}: CartPanelProps) {
  return (
    <div style={styles.cartCard}>
      <div style={styles.detailHeader}>
        <div>
          <p style={styles.eyebrow}>Tu pedido</p>
          <h2 style={styles.sectionTitle}>Carrito visible</h2>
        </div>
        <div style={styles.cartBadge}>
          <strong>{cartItems.length}</strong>
          <span>items</span>
        </div>
      </div>
      {cartItems.length === 0 ? (
        <p style={styles.emptyText}>Todavia no agregaste productos.</p>
      ) : (
        <div style={styles.cartList}>
          {cartItems.map((item) => (
            <article key={item.id} style={styles.cartItem}>
              <div style={styles.summaryRow}>
                <strong>
                  {item.quantity} x {item.productName}
                </strong>
                <div style={styles.cartItemActions}>
                  <strong>{currencyFormatter.format(item.total)}</strong>
                  <button onClick={() => onRemoveCartItem(item.id)} style={styles.removeCartButton}>
                    Quitar
                  </button>
                </div>
              </div>
              {item.modifiers.map((modifier) => (
                <div key={`${item.id}-${modifier.groupId}-${modifier.optionId}`} style={styles.cartModifier}>
                  {modifier.optionName}
                </div>
              ))}
            </article>
          ))}
        </div>
      )}
      <div style={styles.summaryRow}>
        <strong>Total pedido</strong>
        <strong>{currencyFormatter.format(cartTotal)}</strong>
      </div>
      <p style={styles.cartHelpText}>Verifica tu carrito y confirma cuando este todo correcto.</p>
      <div style={styles.customerForm}>
        <label style={styles.fieldLabel}>
          Nombre y apellido
          <input
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            placeholder="Ej: Juan Perez"
            style={styles.fieldInput}
          />
        </label>
        <label style={styles.fieldLabel}>
          Telefono (opcional)
          <input
            value={customerPhone}
            onChange={(event) => onCustomerPhoneChange(event.target.value)}
            placeholder="Ej: 11 5555 5555"
            style={styles.fieldInput}
          />
        </label>
      </div>
      {submitMessage ? <p style={styles.submitMessage}>{submitMessage}</p> : null}
      {lastSubmittedOrder ? (
        <div style={styles.successCard}>
          <strong>Pedido enviado con exito</strong>
          <span>Comanda {lastSubmittedOrder.id}</span>
          <span>Mesa {lastSubmittedOrder.tableId}</span>
          <span>{lastSubmittedOrder.customerName}</span>
        </div>
      ) : null}
      {lastSubmittedOrder && trackedOrderStatus ? (
        <div style={styles.trackingCard}>
          <p style={styles.eyebrow}>Seguimiento</p>
          <strong style={styles.trackingTitle}>Estado de tu pedido</strong>
          <div style={styles.trackingStatus}>{getOrderStatusLabel(trackedOrderStatus)}</div>
          <p style={styles.trackingCopy}>
            {trackedOrderStatus === "pending"
              ? "Recibimos tu pedido y lo estamos preparando para cocina."
              : trackedOrderStatus === "preparing"
                ? "Tu pedido ya esta en preparacion."
                : trackedOrderStatus === "ready"
                  ? "Tu pedido esta listo."
                  : "Tu pedido fue entregado."}
          </p>
        </div>
      ) : null}
      <button
        onClick={onSubmitOrder}
        disabled={!canSubmitOrder || isSubmittingOrder}
        style={{
          ...styles.submitOrderButton,
          ...(!canSubmitOrder || isSubmittingOrder ? styles.addButtonDisabled : {}),
        }}
      >
        {isSubmittingOrder ? "Enviando..." : "Confirmar pedido"}
      </button>
      <p style={styles.ticketFooterText}>{settings.ticketFooter}</p>
    </div>
  );
}
