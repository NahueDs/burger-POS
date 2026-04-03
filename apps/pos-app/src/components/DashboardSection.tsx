import type { PublicAppSettings } from "@burger-pos/shared";
import type { DailySummary } from "../types";
import { currencyFormatter } from "../lib/order-ui";
import { styles } from "../styles";

type DashboardSectionProps = {
  isSavingSettings: boolean;
  settings: PublicAppSettings;
  settingsMessage: string | null;
  summary: DailySummary;
  onBusinessNameChange: (value: string) => void;
  onSaveSettings: () => void;
  onTableLabelsChange: (value: string) => void;
  onTicketFooterChange: (value: string) => void;
};

export function DashboardSection({
  isSavingSettings,
  settings,
  settingsMessage,
  summary,
  onBusinessNameChange,
  onSaveSettings,
  onTableLabelsChange,
  onTicketFooterChange,
}: DashboardSectionProps) {
  return (
    <section style={styles.dashboardGrid}>
      <article style={styles.summaryCard}>
        <p style={styles.eyebrow}>Registro del dia</p>
        <h2 style={styles.sectionTitle}>{summary.businessDay || "Hoy"}</h2>
        <div style={styles.summaryValue}>{currencyFormatter.format(summary.totalRevenue)}</div>
        <div style={styles.metricRow}><span>Pedidos totales</span><strong>{summary.orderCount}</strong></div>
        <div style={styles.metricRow}><span>Desde tablet</span><strong>{summary.bySource.tablet}</strong></div>
        <div style={styles.metricRow}><span>Desde caja</span><strong>{summary.bySource.pos}</strong></div>
        <div style={styles.metricRow}><span>Pendientes</span><strong>{summary.byStatus.pending}</strong></div>
        <div style={styles.metricRow}><span>En preparacion</span><strong>{summary.byStatus.preparing}</strong></div>
        <div style={styles.metricRow}><span>Listos</span><strong>{summary.byStatus.ready}</strong></div>
        <div style={styles.metricRow}><span>Entregados</span><strong>{summary.byStatus.delivered}</strong></div>
      </article>

      <article style={styles.settingsCard}>
        <p style={styles.eyebrow}>Configuracion</p>
        <h2 style={styles.sectionTitle}>Datos del local</h2>

        <label style={styles.label}>
          Nombre del negocio
          <input value={settings.businessName} onChange={(event) => onBusinessNameChange(event.target.value)} style={styles.input} />
        </label>

        <label style={styles.label}>
          Pie del ticket
          <input value={settings.ticketFooter} onChange={(event) => onTicketFooterChange(event.target.value)} style={styles.input} />
        </label>

        <label style={styles.label}>
          Mesas del local
          <input
            value={settings.tableLabels.join(", ")}
            onChange={(event) => onTableLabelsChange(event.target.value)}
            style={styles.input}
            placeholder="1, 2, 3, barra"
          />
        </label>

        <div style={styles.footer}>
          <div>
            <p style={styles.eyebrow}>Ticket actual</p>
            <strong>{settings.businessName}</strong>
          </div>
          <button
            onClick={onSaveSettings}
            disabled={isSavingSettings}
            style={{ ...styles.actionButton, ...(isSavingSettings ? styles.buttonDisabled : {}) }}
          >
            {isSavingSettings ? "Guardando..." : "Guardar configuracion"}
          </button>
        </div>
        {settingsMessage ? <p style={styles.successText}>{settingsMessage}</p> : null}
      </article>
    </section>
  );
}
