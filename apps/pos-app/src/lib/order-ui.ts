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
          <div class="item-title">${item.quantity} X ${item.productName}</div>
          ${modifiersHtml}
        </div>
      `;
    })
    .join("");

  const compactDate = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(order.createdAt));

  printWindow.document.write(`
    <html>
      <head>
        <title>Comanda ${order.id}</title>
        <style>
          @page {
            size: 48mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            width: 48mm;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: monospace;
            color: #111;
            padding: 1.5mm;
            font-size: 12px;
            line-height: 1.15;
            font-weight: 700;
            text-transform: uppercase;
          }
          .ticket { width: 100%; }
          .center {
            text-align: center;
          }
          .divider {
            border-top: 1px dashed #111;
            margin: 3px 0;
          }
          .meta-line {
            margin: 1px 0;
            word-break: break-word;
          }
          .item {
            margin-bottom: 3px;
          }
          .item-title {
            font-size: 13px;
            word-break: break-word;
          }
          .modifier {
            margin-left: 2mm;
            font-size: 11px;
            margin-top: 1px;
            word-break: break-word;
          }
          .business-name {
            font-size: 15px;
            font-weight: 800;
            margin-bottom: 1px;
          }
          .ticket-title {
            font-size: 13px;
            font-weight: 800;
          }
          .total {
            font-size: 14px;
            font-weight: 800;
            word-break: break-word;
          }
          .footer-text {
            font-size: 11px;
            margin-top: 1px;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center">
            <div class="business-name">${settings.businessName}</div>
            <div class="ticket-title">Comanda cocina</div>
          </div>
          <div class="divider"></div>
          <div class="meta-line">Pedido: ${order.id}</div>
          <div class="meta-line">Mesa: ${order.tableId}</div>
          <div class="meta-line">Origen: ${sourceLabel[order.source]}</div>
          <div class="meta-line">Estado: ${statusLabel[order.status]}</div>
          <div class="meta-line">Fecha: ${compactDate}</div>
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="total">Total: ${currencyFormatter.format(order.total)}</div>
          <div class="divider"></div>
          <div class="center footer-text">${settings.ticketFooter}</div>
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
