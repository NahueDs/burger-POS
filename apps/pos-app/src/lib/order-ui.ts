import {
  createInitialSelections,
  getModifierGroupsForProduct,
  buildSelectedModifiers,
  calculateItemTotal,
  isGroupValid,
  products,
  type Order,
  type OrderSource,
  type OrderStatus,
  type PublicAppSettings,
  type SelectionState,
} from "@burger-pos/shared";
import type { CSSProperties } from "react";

export {
  buildSelectedModifiers,
  calculateItemTotal,
  createInitialSelections,
  getModifierGroupsForProduct,
  isGroupValid,
};
export type { SelectionState };

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const statusLabel: Record<OrderStatus, string> = {
  pending: "Pendiente",
  preparing: "En preparacion",
  ready: "Listo",
  delivered: "Entregado",
};

export const sourceLabel: Record<OrderSource, string> = {
  tablet: "Tablet",
  pos: "Caja",
};

export const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
};

export const productMap = new Map(products.map((product) => [product.id, product]));

export const emptySettings: PublicAppSettings = {
  businessName: "Burger POS",
  ticketFooter: "Gracias por tu compra.",
  tableLabels: [],
};

export function formatTicketDate(dateIso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateIso));
}

export function printOrderTicket(order: Order, settings: PublicAppSettings) {
  const printWindow = window.open("", "_blank", "width=420,height=800");

  if (!printWindow) {
    return;
  }

  const itemsHtml = order.items
    .map((item) => {
      const modifiersHtml =
        item.modifiers.length > 0
          ? item.modifiers.map((modifier) => `<div class="modifier">- ${modifier.optionName}</div>`).join("")
          : '<div class="modifier">- Sin modificaciones</div>';

      return `
        <div class="item">
          <div class="item-row">
            <span>${item.quantity} x ${item.productName}</span>
            <span>${currencyFormatter.format(item.total)}</span>
          </div>
          ${modifiersHtml}
        </div>
      `;
    })
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Comanda ${order.id}</title>
        <style>
          body {
            width: 80mm;
            margin: 0 auto;
            font-family: monospace;
            color: #111;
            padding: 8px;
          }
          .ticket { width: 100%; }
          .center { text-align: center; }
          .divider {
            border-top: 1px dashed #111;
            margin: 8px 0;
          }
          .row, .item-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }
          .item { margin-bottom: 8px; }
          .modifier { margin-left: 8px; font-size: 12px; }
          .total { font-size: 16px; font-weight: bold; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center">
            <strong>${settings.businessName}</strong><br />
            Comanda de cocina
          </div>
          <div class="divider"></div>
          <div class="row"><span>Pedido</span><span>${order.id}</span></div>
          <div class="row"><span>Mesa</span><span>${order.tableId}</span></div>
          <div class="row"><span>Origen</span><span>${sourceLabel[order.source]}</span></div>
          <div class="row"><span>Estado</span><span>${statusLabel[order.status]}</span></div>
          <div class="row"><span>Fecha</span><span>${formatTicketDate(order.createdAt)}</span></div>
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="row total"><span>Total</span><span>${currencyFormatter.format(order.total)}</span></div>
          <div class="divider"></div>
          <div class="center">${settings.ticketFooter}</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export const statusStyles: Record<OrderStatus, CSSProperties> = {
  pending: {
    background: "#ffedd5",
    color: "#9a3412",
  },
  preparing: {
    background: "#fef3c7",
    color: "#92400e",
  },
  ready: {
    background: "#dcfce7",
    color: "#166534",
  },
  delivered: {
    background: "#e5e7eb",
    color: "#374151",
  },
};
