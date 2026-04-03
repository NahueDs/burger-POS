import type { Order, OrderStatus, PublicAppSettings } from "@burger-pos/shared";
import { currencyFormatter, formatTicketDate, nextStatusMap, printOrderTicket, sourceLabel, statusLabel, statusStyles } from "../lib/order-ui";
import { styles } from "../styles";

type OrdersSectionProps = {
  emptyCopy: string;
  orders: Order[];
  settings: PublicAppSettings;
  title: string;
  eyebrow: string;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
};

export function OrdersSection({
  emptyCopy,
  orders,
  settings,
  title,
  eyebrow,
  onUpdateOrderStatus,
}: OrdersSectionProps) {
  return (
    <section style={styles.ordersSection}>
      <div style={styles.sectionHeading}>
        <div>
          <p style={styles.eyebrow}>{eyebrow}</p>
          <h2 style={styles.sectionTitle}>{title}</h2>
        </div>
        <div style={styles.sectionCount}>{orders.length}</div>
      </div>
      {orders.length === 0 ? (
        <section style={styles.emptyCard}>
          <p style={styles.copy}>{emptyCopy}</p>
        </section>
      ) : null}
      <div style={styles.grid}>
        {orders.map((order) => {
          const nextStatus = nextStatusMap[order.status];

          return (
            <article key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.eyebrow}>{sourceLabel[order.source]} · Mesa {order.tableId}</p>
                  <h2 style={styles.sectionTitle}>{order.id}</h2>
                  <p style={styles.cardMeta}>Ingresado {formatTicketDate(order.createdAt)}</p>
                </div>
                <span style={{ ...styles.statusBadge, ...statusStyles[order.status] }}>{statusLabel[order.status]}</span>
              </div>

              <div style={styles.itemsList}>
                {order.items.map((item) => (
                  <div key={item.id} style={styles.itemCard}>
                    <div style={styles.row}>
                      <strong>{item.quantity} x {item.productName}</strong>
                      <strong>{currencyFormatter.format(item.total)}</strong>
                    </div>
                    {item.modifiers.length > 0 ? (
                      item.modifiers.map((modifier) => (
                        <div key={`${item.id}-${modifier.groupId}-${modifier.optionId}`} style={styles.modifierText}>
                          {modifier.optionName}
                        </div>
                      ))
                    ) : (
                      <div style={styles.modifierText}>Sin modificaciones</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={styles.footer}>
                <div>
                  <p style={styles.eyebrow}>Total</p>
                  <strong style={styles.totalValue}>{currencyFormatter.format(order.total)}</strong>
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => printOrderTicket(order, settings)} style={styles.printButton}>
                    {order.status === "delivered" ? "Reimprimir" : "Imprimir"}
                  </button>
                  {nextStatus ? (
                    <button onClick={() => onUpdateOrderStatus(order.id, nextStatus)} style={styles.actionButton}>
                      {nextStatus === "delivered" ? "Marcar entregado" : `Pasar a ${statusLabel[nextStatus]}`}
                    </button>
                  ) : (
                    <span style={styles.readyText}>Entregado</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
