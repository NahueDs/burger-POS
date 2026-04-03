import type { Category, PublicAppSettings } from "@burger-pos/shared";
import { styles } from "../styles";

type CategorySidebarProps = {
  activeCategoryId: string;
  categories: Category[];
  isMobileLayout: boolean;
  isTabletStacked: boolean;
  settings: PublicAppSettings;
  tableId: string;
  onSelectCategory: (categoryId: string) => void;
};

export function CategorySidebar({
  activeCategoryId,
  categories,
  isMobileLayout,
  isTabletStacked,
  settings,
  tableId,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <aside
      style={{
        ...styles.sidebar,
        ...(isTabletStacked ? styles.sidebarStacked : {}),
        ...(isMobileLayout ? styles.sidebarMobile : {}),
      }}
    >
      <div>
        <p style={styles.eyebrow}>Mesa {tableId}</p>
        <h1 style={styles.title}>{settings.businessName}</h1>
        <p style={styles.copy}>Explora el menu, personaliza tu pedido y revisa el carrito antes de confirmar.</p>
      </div>
      <div
        style={{
          ...styles.categoryList,
          ...(isTabletStacked ? styles.categoryListInline : {}),
        }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            style={{
              ...styles.categoryButton,
              ...(category.id === activeCategoryId ? styles.categoryButtonActive : {}),
              ...(isTabletStacked ? styles.categoryButtonInline : {}),
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
    </aside>
  );
}
