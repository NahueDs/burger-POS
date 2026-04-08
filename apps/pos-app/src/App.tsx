import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  defaultCatalog,
  type Category,
  type CreateOrderInput,
  type MenuCatalog,
  type ModifierGroup,
  type ModifierOption,
  type Order,
  type OrderItem,
  type OrderSource,
  type OrderStatus,
  type Product,
  type PublicAppSettings,
} from "@burger-pos/shared";
import { AuthScreen } from "./components/AuthScreen";
import { CatalogSection } from "./components/CatalogSection";
import { DashboardSection } from "./components/DashboardSection";
import { FiltersBar } from "./components/FiltersBar";
import { ManualOrderPanel } from "./components/ManualOrderPanel";
import { OrdersSection } from "./components/OrdersSection";
import {
  buildSelectedModifiers,
  calculateItemTotal,
  createInitialSelections,
  emptySettings,
  getModifierGroupsForProduct,
  isGroupValid,
  type SelectionState,
} from "./lib/order-ui";
import { styles } from "./styles";
import type { DailySummary, DraftCartItem } from "./types";

const SERVER_URL = "http://localhost:4000";
const socket = io(SERVER_URL, { autoConnect: false });
const POS_AUTH_STORAGE_KEY = "burger-pos-auth-token";

const emptySummary: DailySummary = {
  businessDay: "",
  orderCount: 0,
  totalRevenue: 0,
  byStatus: {
    pending: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
  },
  bySource: {
    tablet: 0,
    pos: 0,
  },
};

type PosTab = "operations" | "catalog" | "settings";

function findDuplicateIds(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    if (seen.has(normalized)) {
      duplicates.add(normalized);
      return;
    }

    seen.add(normalized);
  });

  return Array.from(duplicates);
}

export default function App() {
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(POS_AUTH_STORAGE_KEY) || "");
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DailySummary>(emptySummary);
  const [settings, setSettings] = useState<PublicAppSettings>(emptySettings);
  const [catalog, setCatalog] = useState<MenuCatalog>(defaultCatalog);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | OrderSource>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [activeTab, setActiveTab] = useState<PosTab>("operations");
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [manualTableId, setManualTableId] = useState("caja");
  const [selectedProductId, setSelectedProductId] = useState(defaultCatalog.products[0]?.id ?? "");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [draftItems, setDraftItems] = useState<DraftCartItem[]>([]);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [catalogDraft, setCatalogDraft] = useState<MenuCatalog>(defaultCatalog);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);
  const [selections, setSelections] = useState<SelectionState>({});

  const productMap = useMemo(
    () => new Map(catalog.products.map((product) => [product.id, product])),
    [catalog.products],
  );

  useEffect(() => {
    if (!selectedProductId) {
      const firstProductId = catalog.products[0]?.id ?? "";
      setSelectedProductId(firstProductId);
    }
  }, [catalog.products, selectedProductId]);

  const fetchWithAuth = async (input: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);

    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      const [ordersResponse, summaryResponse, settingsResponse, catalogResponse] = await Promise.all([
        fetchWithAuth(`${SERVER_URL}/orders`),
        fetchWithAuth(`${SERVER_URL}/orders/daily-summary`),
        fetchWithAuth(`${SERVER_URL}/settings`),
        fetchWithAuth(`${SERVER_URL}/catalog`),
      ]);

      if ([ordersResponse, summaryResponse, settingsResponse, catalogResponse].some((response) => response.status === 401)) {
        window.localStorage.removeItem(POS_AUTH_STORAGE_KEY);
        setAuthToken("");
        setOrders([]);
        setSummary(emptySummary);
        setSettings(emptySettings);
        setLoading(false);
        return;
      }

      const ordersData = (await ordersResponse.json()) as Order[];
      const summaryData = (await summaryResponse.json()) as DailySummary;
      const settingsData = (await settingsResponse.json()) as PublicAppSettings;
      const catalogData = (await catalogResponse.json()) as MenuCatalog;

      setOrders(ordersData);
      setSummary(summaryData);
      setSettings(settingsData);
      setCatalog(catalogData);
      setCatalogDraft(catalogData);
      setLoading(false);
    };

    void loadInitialData();

    socket.auth = { token: authToken };
    socket.connect();

    const handleSync = (incomingOrders: Order[]) => {
      setOrders(incomingOrders);
      setLoading(false);
    };

    const handleNew = (order: Order) => {
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      setNewOrderAlert(`Nuevo pedido ${order.id} · Mesa ${order.tableId}`);

      try {
        const AudioContextClass =
          window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.35);

          window.setTimeout(() => {
            void audioContext.close();
          }, 500);
        }
      } catch {
        // If audio is blocked by the browser, the visual alert still appears.
      }
    };

    const handleUpdated = (updatedOrder: Order) => {
      setOrders((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
    };

    const handleSummary = (incomingSummary: DailySummary) => {
      setSummary(incomingSummary);
    };

    const handleSettings = (incomingSettings: PublicAppSettings) => {
      setSettings(incomingSettings);
    };

    const handleCatalog = (incomingCatalog: MenuCatalog) => {
      setCatalog(incomingCatalog);
      setCatalogDraft(incomingCatalog);
    };

    socket.on("orders:sync", handleSync);
    socket.on("orders:new", handleNew);
    socket.on("orders:updated", handleUpdated);
    socket.on("orders:summary", handleSummary);
    socket.on("settings:updated", handleSettings);
    socket.on("catalog:updated", handleCatalog);

    return () => {
      socket.off("orders:sync", handleSync);
      socket.off("orders:new", handleNew);
      socket.off("orders:updated", handleUpdated);
      socket.off("orders:summary", handleSummary);
      socket.off("settings:updated", handleSettings);
      socket.off("catalog:updated", handleCatalog);
      socket.disconnect();
    };
  }, [authToken]);

  useEffect(() => {
    if (!newOrderAlert) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNewOrderAlert(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [newOrderAlert]);

  const selectedProduct = productMap.get(selectedProductId) ?? null;
  const selectedGroups = useMemo(
    () => getModifierGroupsForProduct(selectedProduct, catalog.modifierGroups),
    [catalog.modifierGroups, selectedProduct],
  );

  useEffect(() => {
    if (!selectedProduct) {
      setSelections({});
      return;
    }

    setSelections(createInitialSelections(selectedProduct, catalog.modifierGroups));
    setSelectedQuantity(1);
  }, [catalog.modifierGroups, selectedProduct]);

  const selectedModifiers = useMemo(
    () => buildSelectedModifiers(selectedGroups, selections),
    [selectedGroups, selections],
  );

  const currentManualItemTotal = selectedProduct
    ? calculateItemTotal(selectedProduct.price, selectedModifiers, selectedQuantity)
    : 0;

  const canAddManualItem =
    selectedProduct !== null &&
    selectedGroups.every((group) => isGroupValid(group, selections[group.id] ?? []));

  const draftTotal = draftItems.reduce((sum, item) => sum + item.item.total, 0);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.id.toLowerCase().includes(normalizedSearch) ||
        order.tableId.toLowerCase().includes(normalizedSearch);
      const matchesSource = sourceFilter === "all" || order.source === sourceFilter;
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [orders, searchTerm, sourceFilter, statusFilter]);

  const activeOrders = useMemo(
    () => filteredOrders.filter((order) => order.status !== "delivered"),
    [filteredOrders],
  );
  const completedOrders = useMemo(
    () => filteredOrders.filter((order) => order.status === "delivered"),
    [filteredOrders],
  );

  const catalogErrors = useMemo(() => {
    const errors: string[] = [];
    const categoryIds = catalogDraft.categories.map((category) => category.id.trim());
    const modifierGroupIds = catalogDraft.modifierGroups.map((group) => group.id.trim());
    const productIds = catalogDraft.products.map((product) => product.id.trim());

    const duplicateCategoryIds = findDuplicateIds(categoryIds);
    const duplicateGroupIds = findDuplicateIds(modifierGroupIds);
    const duplicateProductIds = findDuplicateIds(productIds);

    duplicateCategoryIds.forEach((id) => errors.push(`La categoria "${id}" tiene un ID duplicado.`));
    duplicateGroupIds.forEach((id) => errors.push(`El grupo de modificadores "${id}" tiene un ID duplicado.`));
    duplicateProductIds.forEach((id) => errors.push(`El producto "${id}" tiene un ID duplicado.`));

    if (catalogDraft.categories.length === 0) {
      errors.push("Debe existir al menos una categoria.");
    }

    if (catalogDraft.products.length === 0) {
      errors.push("Debe existir al menos un producto.");
    }

    catalogDraft.categories.forEach((category) => {
      if (!category.id.trim()) {
        errors.push("Hay una categoria sin ID.");
      }

      if (!category.name.trim()) {
        errors.push(`La categoria "${category.id || "(sin id)"}" no tiene nombre.`);
      }
    });

    const categoryIdSet = new Set(categoryIds.filter(Boolean));

    catalogDraft.modifierGroups.forEach((group) => {
      if (!group.id.trim()) {
        errors.push("Hay un grupo de modificadores sin ID.");
      }

      if (!group.name.trim()) {
        errors.push(`El grupo "${group.id || "(sin id)"}" no tiene nombre.`);
      }

      if (typeof group.min === "number" && group.min < 0) {
        errors.push(`El grupo "${group.name || group.id}" tiene un minimo invalido.`);
      }

      if (typeof group.max === "number" && group.max < 0) {
        errors.push(`El grupo "${group.name || group.id}" tiene un maximo invalido.`);
      }

      if (typeof group.min === "number" && typeof group.max === "number" && group.min > group.max) {
        errors.push(`El grupo "${group.name || group.id}" tiene minimo mayor que maximo.`);
      }

      if (group.options.length === 0) {
        errors.push(`El grupo "${group.name || group.id}" no tiene opciones.`);
      }

      const duplicateOptionIds = findDuplicateIds(group.options.map((option) => option.id.trim()));
      duplicateOptionIds.forEach((id) =>
        errors.push(`El grupo "${group.name || group.id}" tiene la opcion duplicada "${id}".`),
      );

      group.options.forEach((option) => {
        if (!option.id.trim()) {
          errors.push(`El grupo "${group.name || group.id}" tiene una opcion sin ID.`);
        }

        if (!option.name.trim()) {
          errors.push(`El grupo "${group.name || group.id}" tiene una opcion sin nombre.`);
        }

        if (option.price < 0) {
          errors.push(`La opcion "${option.name || option.id}" del grupo "${group.name || group.id}" tiene precio negativo.`);
        }
      });
    });

    const modifierGroupIdSet = new Set(modifierGroupIds.filter(Boolean));

    catalogDraft.products.forEach((product) => {
      if (!product.id.trim()) {
        errors.push("Hay un producto sin ID.");
      }

      if (!product.name.trim()) {
        errors.push(`El producto "${product.id || "(sin id)"}" no tiene nombre.`);
      }

      if (!categoryIdSet.has(product.categoryId.trim())) {
        errors.push(`El producto "${product.name || product.id}" apunta a una categoria inexistente.`);
      }

      if (product.price < 0) {
        errors.push(`El producto "${product.name || product.id}" tiene precio negativo.`);
      }

      product.modifierGroupIds.forEach((groupId) => {
        if (!modifierGroupIdSet.has(groupId.trim())) {
          errors.push(`El producto "${product.name || product.id}" usa el grupo inexistente "${groupId}".`);
        }
      });
    });

    return Array.from(new Set(errors));
  }, [catalogDraft]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const response = await fetchWithAuth(`${SERVER_URL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      return;
    }

    const updatedOrder = (await response.json()) as Order;
    setOrders((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
  };

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

  const addDraftItem = () => {
    if (!selectedProduct || !canAddManualItem) {
      return;
    }

    const item: OrderItem = {
      id: `pos-${selectedProduct.id}-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      basePrice: selectedProduct.price,
      modifiers: selectedModifiers,
      quantity: selectedQuantity,
      total: currentManualItemTotal,
    };

    setDraftItems((current) => [...current, { item }]);
    setManualMessage(null);
    setSelections(createInitialSelections(selectedProduct, catalog.modifierGroups));
    setSelectedQuantity(1);
  };

  const removeDraftItem = (itemId: string) => {
    setDraftItems((current) => current.filter((entry) => entry.item.id !== itemId));
  };

  const submitManualOrder = async () => {
    if (draftItems.length === 0) {
      return;
    }

    setIsSubmittingManualOrder(true);
    setManualMessage(null);

    try {
      const payload: CreateOrderInput = {
        tableId: manualTableId.trim() || "caja",
        items: draftItems.map((entry) => entry.item),
        total: draftTotal,
        customerName: "Pedido de caja",
        source: "pos",
      };

      const response = await fetchWithAuth(`${SERVER_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el pedido");
      }

      setDraftItems([]);
      setManualTableId("caja");
      setManualMessage("Pedido cargado desde caja.");
    } catch {
      setManualMessage("No se pudo cargar el pedido desde caja.");
    } finally {
      setIsSubmittingManualOrder(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSourceFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchTerm.length > 0 || sourceFilter !== "all" || statusFilter !== "all";

  const loginToPos = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await fetch(`${SERVER_URL}/auth/pos-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (!response.ok) {
        throw new Error("PIN incorrecto");
      }

      const data = (await response.json()) as { token: string; settings: PublicAppSettings };
      window.localStorage.setItem(POS_AUTH_STORAGE_KEY, data.token);
      setAuthToken(data.token);
      setSettings(data.settings);
      setPinInput("");
    } catch {
      setAuthError("PIN incorrecto");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logoutFromPos = () => {
    window.localStorage.removeItem(POS_AUTH_STORAGE_KEY);
    setAuthToken("");
    setOrders([]);
    setSummary(emptySummary);
    setSettings(emptySettings);
    setAuthError(null);
    setLoading(false);
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsMessage(null);

    try {
      const response = await fetchWithAuth(`${SERVER_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la configuracion");
      }

      const nextSettings = (await response.json()) as PublicAppSettings;
      setSettings(nextSettings);
      setSettingsMessage("Configuracion guardada.");
    } catch {
      setSettingsMessage("No se pudo guardar la configuracion.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveCatalog = async () => {
    if (catalogErrors.length > 0) {
      setCatalogMessage("Corrige los errores del catalogo antes de guardar.");
      return;
    }

    setIsSavingCatalog(true);
    setCatalogMessage(null);

    try {
      if (
        !Array.isArray(catalogDraft.categories) ||
        !Array.isArray(catalogDraft.modifierGroups) ||
        !Array.isArray(catalogDraft.products)
      ) {
        throw new Error("Formato invalido");
      }

      const response = await fetchWithAuth(`${SERVER_URL}/catalog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(catalogDraft),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el catalogo");
      }

      const nextCatalog = (await response.json()) as MenuCatalog;
      setCatalog(nextCatalog);
      setCatalogDraft(nextCatalog);
      setCatalogMessage("Catalogo guardado.");
    } catch {
      setCatalogMessage("No se pudo guardar el catalogo. Revisa los datos cargados.");
    } finally {
      setIsSavingCatalog(false);
    }
  };

  const updateCatalogDraft = (updater: (current: MenuCatalog) => MenuCatalog) => {
      setCatalogDraft((current) => updater(current));
      setCatalogMessage(null);
  };

  const updateCategory = (categoryId: string, patch: Partial<Category>) => {
    updateCatalogDraft((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category,
      ),
      products: patch.id
        ? current.products.map((product) =>
            product.categoryId === categoryId ? { ...product, categoryId: patch.id ?? product.categoryId } : product,
          )
        : current.products,
    }));
  };

  const removeCategory = (categoryId: string) => {
    const category = catalogDraft.categories.find((item) => item.id === categoryId);
    const confirmed = window.confirm(
      `Vas a quitar la categoria "${category?.name || categoryId}" y tambien los productos asociados. ¿Quieres continuar?`,
    );

    if (!confirmed) {
      return;
    }

    updateCatalogDraft((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
      products: current.products.filter((product) => product.categoryId !== categoryId),
    }));
  };

  const updateModifierGroup = (groupId: string, patch: Partial<ModifierGroup>) => {
    updateCatalogDraft((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
      products: patch.id
        ? current.products.map((product) => ({
            ...product,
            modifierGroupIds: product.modifierGroupIds.map((modifierGroupId) =>
              modifierGroupId === groupId ? patch.id ?? modifierGroupId : modifierGroupId,
            ),
          }))
        : current.products,
    }));
  };

  const removeModifierGroup = (groupId: string) => {
    const group = catalogDraft.modifierGroups.find((item) => item.id === groupId);
    const confirmed = window.confirm(
      `Vas a quitar el grupo "${group?.name || groupId}" y se desvinculara de los productos que lo usan. ¿Quieres continuar?`,
    );

    if (!confirmed) {
      return;
    }

    updateCatalogDraft((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.filter((group) => group.id !== groupId),
      products: current.products.map((product) => ({
        ...product,
        modifierGroupIds: product.modifierGroupIds.filter((modifierGroupId) => modifierGroupId !== groupId),
      })),
    }));
  };

  const updateModifierOption = (groupId: string, optionId: string, patch: Partial<ModifierOption>) => {
    updateCatalogDraft((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)),
            }
          : group,
      ),
    }));
  };

  const removeModifierOption = (groupId: string, optionId: string) => {
    const group = catalogDraft.modifierGroups.find((item) => item.id === groupId);
    const option = group?.options.find((item) => item.id === optionId);
    const confirmed = window.confirm(
      `Vas a quitar la opcion "${option?.name || optionId}" del grupo "${group?.name || groupId}". ¿Quieres continuar?`,
    );

    if (!confirmed) {
      return;
    }

    updateCatalogDraft((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((option) => option.id !== optionId),
            }
          : group,
      ),
    }));
  };

  const updateProduct = (productId: string, patch: Partial<Product>) => {
    updateCatalogDraft((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, ...patch } : product,
      ),
    }));
  };

  const removeProduct = (productId: string) => {
    const product = catalogDraft.products.find((item) => item.id === productId);
    const confirmed = window.confirm(
      `Vas a quitar el producto "${product?.name || productId}" del catalogo. ¿Quieres continuar?`,
    );

    if (!confirmed) {
      return;
    }

    updateCatalogDraft((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== productId),
    }));
  };

  const addCategory = () => {
    const nextIndex = catalogDraft.categories.length + 1;
    updateCatalogDraft((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: `category-${nextIndex}`,
          name: `Nueva categoria ${nextIndex}`,
        },
      ],
    }));
  };

  const addModifierGroup = () => {
    const nextIndex = catalogDraft.modifierGroups.length + 1;
    updateCatalogDraft((current) => ({
      ...current,
      modifierGroups: [
        ...current.modifierGroups,
        {
          id: `group-${nextIndex}`,
          name: `Nuevo grupo ${nextIndex}`,
          type: "multiple",
          required: false,
          options: [],
        },
      ],
    }));
  };

  const addModifierOption = (groupId: string) => {
    updateCatalogDraft((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                {
                  id: `${group.id}-option-${group.options.length + 1}`,
                  name: `Nueva opcion ${group.options.length + 1}`,
                  price: 0,
                  isRemovable: false,
                },
              ],
            }
          : group,
      ),
    }));
  };

  const addProduct = () => {
    const fallbackCategoryId = catalogDraft.categories[0]?.id ?? "general";
    updateCatalogDraft((current) => ({
      ...current,
      products: [
        ...current.products,
        {
          id: `product-${current.products.length + 1}`,
          name: `Nuevo producto ${current.products.length + 1}`,
          description: "",
          price: 0,
          categoryId: fallbackCategoryId,
          modifierGroupIds: [],
        },
      ],
    }));
  };

  if (!authToken) {
    return (
      <AuthScreen
        authError={authError}
        isAuthenticating={isAuthenticating}
        pinInput={pinInput}
        onChangePin={setPinInput}
        onLogin={loginToPos}
      />
    );
  }

  return (
    <main style={styles.app}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Panel del local</p>
          <h1 style={styles.title}>{settings.businessName}</h1>
          <p style={styles.copy}>Caja y tablet ahora usan la misma logica de productos y modificadores.</p>
        </div>
        <button onClick={logoutFromPos} style={styles.secondaryButton}>
          Cerrar sesion
        </button>
      </section>

      {newOrderAlert ? (
        <section style={styles.alertBanner}>
          <strong>{newOrderAlert}</strong>
        </section>
      ) : null}

      <section style={styles.tabsRow}>
        <button
          onClick={() => setActiveTab("operations")}
          style={{
            ...styles.tabButton,
            ...(activeTab === "operations" ? styles.tabButtonActive : {}),
          }}
        >
          Operacion diaria
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          style={{
            ...styles.tabButton,
            ...(activeTab === "catalog" ? styles.tabButtonActive : {}),
          }}
        >
          Catalogo
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            ...styles.tabButton,
            ...(activeTab === "settings" ? styles.tabButtonActive : {}),
          }}
        >
          Configuracion
        </button>
      </section>

      {activeTab === "operations" ? (
        <>
          {loading ? <p style={styles.emptyText}>Cargando pedidos...</p> : null}

          {!loading && orders.length === 0 ? (
            <section style={styles.emptyCard}>
              <h2 style={styles.sectionTitle}>Sin pedidos activos</h2>
              <p style={styles.copy}>Cuando una mesa confirme su pedido, va a aparecer automaticamente aca.</p>
            </section>
          ) : null}

          <OrdersSection
            emptyCopy="No hay pedidos pendientes, en preparacion o listos para entregar."
            eyebrow="Operacion"
            orders={activeOrders}
            settings={settings}
            title="Pedidos activos"
            onUpdateOrderStatus={updateOrderStatus}
          />

          <OrdersSection
            emptyCopy="Todavia no hay pedidos entregados en el historial de hoy."
            eyebrow="Registro"
            orders={completedOrders}
            settings={settings}
            title="Historial del dia"
            onUpdateOrderStatus={updateOrderStatus}
          />

          <FiltersBar
            hasActiveFilters={hasActiveFilters}
            searchTerm={searchTerm}
            sourceFilter={sourceFilter}
            statusFilter={statusFilter}
            onClear={clearFilters}
            onSearchChange={setSearchTerm}
            onSourceChange={setSourceFilter}
            onStatusChange={setStatusFilter}
          />

          <ManualOrderPanel
            canAddManualItem={canAddManualItem}
            products={catalog.products}
            currentManualItemTotal={currentManualItemTotal}
            draftItems={draftItems}
            draftTotal={draftTotal}
            isSubmittingManualOrder={isSubmittingManualOrder}
            manualMessage={manualMessage}
            manualTableId={manualTableId}
            selectedGroups={selectedGroups}
            selectedProduct={selectedProduct}
            selectedProductId={selectedProductId}
            selectedQuantity={selectedQuantity}
            selections={selections}
            onAddDraftItem={addDraftItem}
            onRemoveDraftItem={removeDraftItem}
            onSelectProduct={setSelectedProductId}
            onSelectSingleOption={selectSingleOption}
            onSetManualTableId={setManualTableId}
            onSetSelectedQuantity={setSelectedQuantity}
            onSubmitManualOrder={submitManualOrder}
            onToggleMultipleOption={toggleMultipleOption}
          />
        </>
      ) : activeTab === "catalog" ? (
        <CatalogSection
          catalog={catalogDraft}
          catalogErrors={catalogErrors}
          catalogMessage={catalogMessage}
          isSavingCatalog={isSavingCatalog}
          onAddCategory={addCategory}
          onAddModifierGroup={addModifierGroup}
          onAddModifierOption={addModifierOption}
          onAddProduct={addProduct}
          onRemoveCategory={removeCategory}
          onRemoveModifierGroup={removeModifierGroup}
          onRemoveModifierOption={removeModifierOption}
          onRemoveProduct={removeProduct}
          onSaveCatalog={saveCatalog}
          onUpdateCategory={updateCategory}
          onUpdateModifierGroup={updateModifierGroup}
          onUpdateModifierOption={updateModifierOption}
          onUpdateProduct={updateProduct}
        />
      ) : (
        <DashboardSection
          isSavingSettings={isSavingSettings}
          settings={settings}
          settingsMessage={settingsMessage}
          summary={summary}
          onBusinessNameChange={(value) => setSettings((current) => ({ ...current, businessName: value }))}
          onSaveSettings={saveSettings}
          onTableLabelsChange={(value) =>
            setSettings((current) => ({
              ...current,
              tableLabels: value
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean),
            }))
          }
          onTicketFooterChange={(value) => setSettings((current) => ({ ...current, ticketFooter: value }))}
        />
      )}
    </main>
  );
}
