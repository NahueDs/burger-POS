import { useEffect, useMemo, useState } from "react";
import {
  type CreateOrderInput,
  defaultCatalog,
  type MenuCatalog,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PublicAppSettings,
} from "@burger-pos/shared";
import { CategorySidebar } from "./components/CategorySidebar";
import { CartPanel } from "./components/CartPanel";
import { MenuPanel } from "./components/MenuPanel";
import { ProductConfigurator } from "./components/ProductConfigurator";
import {
  type SelectionState,
  buildSelectedModifiers,
  calculateItemTotal,
  createInitialSelections,
  getModifierGroupsForProduct,
  isGroupValid,
} from "@burger-pos/shared";
import { styles } from "./styles";

const SERVER_URL = "http://localhost:4000";
const DEFAULT_SETTINGS: PublicAppSettings = {
  businessName: "Burger POS",
  ticketFooter: "Gracias por tu compra.",
  tableLabels: ["5"],
};

export default function App() {
  const [settings, setSettings] = useState<PublicAppSettings>(DEFAULT_SETTINGS);
  const [catalog, setCatalog] = useState<MenuCatalog>(defaultCatalog);
  const [tableId] = useState(DEFAULT_SETTINGS.tableLabels[0] || "5");
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCatalog.products[0]?.categoryId ?? "");
  const [selectedProductId, setSelectedProductId] = useState(defaultCatalog.products[0]?.id ?? "");
  const [selections, setSelections] = useState<SelectionState>({});
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<Order | null>(null);
  const [trackedOrderStatus, setTrackedOrderStatus] = useState<OrderStatus | null>(null);

  const isTabletStacked = viewportWidth < 1180;
  const isMobileLayout = viewportWidth < 820;

  const filteredProducts = useMemo(
    () => catalog.products.filter((product) => product.categoryId === activeCategoryId),
    [activeCategoryId, catalog.products],
  );

  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ?? filteredProducts[0] ?? null;

  const selectedGroups = useMemo(
    () => getModifierGroupsForProduct(selectedProduct, catalog.modifierGroups),
    [catalog.modifierGroups, selectedProduct],
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [settingsResponse, catalogResponse] = await Promise.all([
          fetch(`${SERVER_URL}/settings/public`),
          fetch(`${SERVER_URL}/catalog/public`),
        ]);

        if (!settingsResponse.ok) {
          return;
        }

        const settingsData = (await settingsResponse.json()) as PublicAppSettings;
        setSettings(settingsData);

        if (catalogResponse.ok) {
          const catalogData = (await catalogResponse.json()) as MenuCatalog;
          setCatalog(catalogData);
        }
      } catch {
        // Keep default branding if settings are unavailable.
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!lastSubmittedOrder) {
      setTrackedOrderStatus(null);
      return;
    }

    let active = true;

    const refreshOrderStatus = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/orders/${lastSubmittedOrder.id}/public`);

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Pick<Order, "id" | "status" | "tableId" | "createdAt">;

        if (!active) {
          return;
        }

        setTrackedOrderStatus(data.status);
        setLastSubmittedOrder((current) =>
          current
            ? {
                ...current,
                status: data.status,
                createdAt: data.createdAt,
                tableId: data.tableId,
              }
            : current,
        );
      } catch {
        // Keep last known status if polling fails.
      }
    };

    void refreshOrderStatus();
    const intervalId = window.setInterval(() => {
      void refreshOrderStatus();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [lastSubmittedOrder?.id]);

  useEffect(() => {
    if (!filteredProducts.some((product) => product.id === selectedProductId) && filteredProducts[0]) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) {
      setSelections({});
      return;
    }

    setSelections(createInitialSelections(selectedProduct, catalog.modifierGroups));
    setQuantity(1);
    setSubmitMessage(null);
  }, [catalog.modifierGroups, selectedProduct]);

  const selectedModifiers = useMemo(
    () => buildSelectedModifiers(selectedGroups, selections),
    [selectedGroups, selections],
  );

  const currentItemTotal = selectedProduct
    ? calculateItemTotal(selectedProduct.price, selectedModifiers, quantity)
    : 0;

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const canSubmitOrder = cartItems.length > 0 && customerName.trim().length > 0;

  const canAddCurrentItem =
    selectedProduct !== null &&
    selectedGroups.every((group) => isGroupValid(group, selections[group.id] ?? []));

  const toggleMultipleOption = (groupId: string, optionId: string) => {
    const group = selectedGroups.find((currentGroup) => currentGroup.id === groupId);

    if (!group || group.type !== "multiple") {
      return;
    }

    setSelections((current) => {
      const selectedIds = current[groupId] ?? [];
      const alreadySelected = selectedIds.includes(optionId);

      if (alreadySelected) {
        return {
          ...current,
          [groupId]: selectedIds.filter((id) => id !== optionId),
        };
      }

      if (typeof group.max === "number" && selectedIds.length >= group.max) {
        return current;
      }

      return {
        ...current,
        [groupId]: [...selectedIds, optionId],
      };
    });
  };

  const selectSingleOption = (groupId: string, optionId: string) => {
    setSelections((current) => ({
      ...current,
      [groupId]: [optionId],
    }));
  };

  const addCurrentItemToCart = () => {
    if (!selectedProduct || !canAddCurrentItem) {
      return;
    }

    const item: OrderItem = {
      id: `${selectedProduct.id}-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      basePrice: selectedProduct.price,
      modifiers: selectedModifiers,
      quantity,
      total: currentItemTotal,
    };

    setCartItems((current) => [...current, item]);
    setSelections(createInitialSelections(selectedProduct, catalog.modifierGroups));
    setQuantity(1);
    setSubmitMessage(null);
  };

  const submitOrder = async () => {
    if (!canSubmitOrder) {
      return;
    }

    setIsSubmittingOrder(true);
    setSubmitMessage(null);

    try {
      const payload: CreateOrderInput = {
        tableId,
        items: cartItems,
        total: cartTotal,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        source: "tablet",
      };

      const response = await fetch(`${SERVER_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el pedido");
      }

      const createdOrder = (await response.json()) as Order;
      setCartItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setLastSubmittedOrder(createdOrder);
      setTrackedOrderStatus(createdOrder.status);
      setSubmitMessage(`Pedido enviado. Numero de comanda: ${createdOrder.id}.`);
    } catch {
      setSubmitMessage("Hubo un problema al enviar el pedido.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId));
    setSubmitMessage(null);
  };

  return (
    <div
      style={{
        ...styles.app,
        ...(isTabletStacked ? styles.appStacked : {}),
        ...(isMobileLayout ? styles.appMobile : {}),
      }}
    >
      <CategorySidebar
        activeCategoryId={activeCategoryId}
        categories={catalog.categories}
        isMobileLayout={isMobileLayout}
        isTabletStacked={isTabletStacked}
        settings={settings}
        tableId={tableId}
        onSelectCategory={setActiveCategoryId}
      />

      <MenuPanel
        activeCategoryId={activeCategoryId}
        categories={catalog.categories}
        filteredProducts={filteredProducts}
        isMobileLayout={isMobileLayout}
        selectedProductId={selectedProduct?.id ?? ""}
        onSelectProduct={setSelectedProductId}
      />

      <section
        style={{
          ...styles.detailPanel,
          ...(isTabletStacked ? styles.detailPanelStacked : {}),
          ...(isMobileLayout ? styles.detailPanelMobile : {}),
        }}
      >
        <ProductConfigurator
          canAddCurrentItem={canAddCurrentItem}
          currentItemTotal={currentItemTotal}
          quantity={quantity}
          selectedGroups={selectedGroups}
          selectedModifiers={selectedModifiers}
          selectedProduct={selectedProduct}
          selections={selections}
          onAddToCart={addCurrentItemToCart}
          onDecreaseQuantity={() => setQuantity((current) => Math.max(1, current - 1))}
          onIncreaseQuantity={() => setQuantity((current) => current + 1)}
          onSelectSingleOption={selectSingleOption}
          onToggleMultipleOption={toggleMultipleOption}
        />

        <CartPanel
          cartItems={cartItems}
          cartTotal={cartTotal}
          customerName={customerName}
          customerPhone={customerPhone}
          isSubmittingOrder={isSubmittingOrder}
          lastSubmittedOrder={lastSubmittedOrder}
          settings={settings}
          submitMessage={submitMessage}
          trackedOrderStatus={trackedOrderStatus}
          canSubmitOrder={canSubmitOrder}
          onCustomerNameChange={setCustomerName}
          onCustomerPhoneChange={setCustomerPhone}
          onRemoveCartItem={removeCartItem}
          onSubmitOrder={submitOrder}
        />
      </section>
    </div>
  );
}
