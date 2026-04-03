import type { OrderSource, OrderStatus } from "@burger-pos/shared";
import { styles } from "../styles";

type FiltersBarProps = {
  hasActiveFilters: boolean;
  searchTerm: string;
  sourceFilter: "all" | OrderSource;
  statusFilter: "all" | OrderStatus;
  onClear: () => void;
  onSearchChange: (value: string) => void;
  onSourceChange: (value: "all" | OrderSource) => void;
  onStatusChange: (value: "all" | OrderStatus) => void;
};

export function FiltersBar({
  hasActiveFilters,
  searchTerm,
  sourceFilter,
  statusFilter,
  onClear,
  onSearchChange,
  onSourceChange,
  onStatusChange,
}: FiltersBarProps) {
  return (
    <section style={styles.filtersBar}>
      <label style={styles.filterField}>
        Buscar
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Mesa o comanda"
          style={styles.input}
        />
      </label>
      <label style={styles.filterField}>
        Origen
        <select
          value={sourceFilter}
          onChange={(event) => onSourceChange(event.target.value as "all" | OrderSource)}
          style={styles.input}
        >
          <option value="all">Todos</option>
          <option value="tablet">Tablet</option>
          <option value="pos">Caja</option>
        </select>
      </label>
      <label style={styles.filterField}>
        Estado
        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as "all" | OrderStatus)}
          style={styles.input}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="preparing">En preparacion</option>
          <option value="ready">Listo</option>
          <option value="delivered">Entregado</option>
        </select>
      </label>
      <button
        onClick={onClear}
        disabled={!hasActiveFilters}
        style={{ ...styles.clearFiltersButton, ...(!hasActiveFilters ? styles.buttonDisabled : {}) }}
      >
        Limpiar filtros
      </button>
    </section>
  );
}
