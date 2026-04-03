import type { Category, Product } from "@burger-pos/shared";
import { styles } from "../styles";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type MenuPanelProps = {
  activeCategoryId: string;
  categories: Category[];
  filteredProducts: Product[];
  isMobileLayout: boolean;
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
};

export function MenuPanel({
  activeCategoryId,
  categories,
  filteredProducts,
  isMobileLayout,
  selectedProductId,
  onSelectProduct,
}: MenuPanelProps) {
  return (
    <main
      style={{
        ...styles.menuPanel,
        ...(isMobileLayout ? styles.menuPanelMobile : {}),
      }}
    >
      <div style={styles.sectionHeader}>
        <div>
          <p style={styles.eyebrow}>Menu</p>
          <h2 style={styles.sectionTitle}>
            {categories.find((category) => category.id === activeCategoryId)?.name ?? "Productos"}
          </h2>
        </div>
      </div>
      <div style={styles.productGrid}>
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product.id)}
            style={{
              ...styles.productCard,
              ...(selectedProductId === product.id ? styles.productCardActive : {}),
            }}
          >
            <div>
              <h3 style={styles.productTitle}>{product.name}</h3>
              <p style={styles.productDescription}>{product.description}</p>
            </div>
            <strong>{currencyFormatter.format(product.price)}</strong>
          </button>
        ))}
      </div>
    </main>
  );
}
