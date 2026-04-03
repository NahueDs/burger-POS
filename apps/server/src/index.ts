import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Server as SocketIOServer } from "socket.io";
import type {
  AppSettings,
  CreateOrderInput,
  MenuCatalog,
  Order,
  OrderStatus,
  PublicAppSettings,
} from "@burger-pos/shared";
import { defaultCatalog as seededCatalog } from "@burger-pos/shared";

const app = express();
const httpServer = createServer(app);
const DATA_ROOT = path.resolve(process.cwd(), "data");
const DATA_DIR = path.join(DATA_ROOT, "orders");
const SETTINGS_FILE = path.join(DATA_ROOT, "settings.json");
const CATALOG_FILE = path.join(DATA_ROOT, "catalog.json");
const authTokens = new Set<string>();

function getBusinessDayKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

function getOrdersFilePath(dayKey = getBusinessDayKey()) {
  return path.join(DATA_DIR, `${dayKey}.json`);
}

function ensureDataDir() {
  if (!existsSync(DATA_ROOT)) {
    mkdirSync(DATA_ROOT, { recursive: true });
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultSettings(): AppSettings {
  return {
    businessName: "Burger POS",
    ticketFooter: "Gracias por tu compra.",
    posPin: process.env.POS_PIN || "1234",
    tableLabels: Array.from({ length: 10 }, (_, index) => String(index + 1)),
  };
}

function sanitizeSettings(settings: AppSettings): PublicAppSettings {
  const { posPin: _posPin, ...publicSettings } = settings;
  return publicSettings;
}

function loadSettings() {
  ensureDataDir();

  if (!existsSync(SETTINGS_FILE)) {
    const defaultSettings = getDefaultSettings();
    writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), "utf8");
    return defaultSettings;
  }

  try {
    const content = readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(content) as Partial<AppSettings>;
    const defaults = getDefaultSettings();

    return {
      businessName: parsed.businessName || defaults.businessName,
      ticketFooter: parsed.ticketFooter || defaults.ticketFooter,
      posPin: parsed.posPin || defaults.posPin,
      tableLabels:
        Array.isArray(parsed.tableLabels) && parsed.tableLabels.length > 0
          ? parsed.tableLabels.map((value) => String(value))
          : defaults.tableLabels,
    };
  } catch {
    return getDefaultSettings();
  }
}

function loadCatalog() {
  ensureDataDir();

  if (!existsSync(CATALOG_FILE)) {
    writeFileSync(CATALOG_FILE, JSON.stringify(seededCatalog, null, 2), "utf8");
    return seededCatalog;
  }

  try {
    const content = readFileSync(CATALOG_FILE, "utf8");
    const parsed = JSON.parse(content) as Partial<MenuCatalog>;

    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : seededCatalog.categories,
      modifierGroups: Array.isArray(parsed.modifierGroups) ? parsed.modifierGroups : seededCatalog.modifierGroups,
      products: Array.isArray(parsed.products) ? parsed.products : seededCatalog.products,
    };
  } catch {
    return seededCatalog;
  }
}

function saveCatalog(nextCatalog: MenuCatalog) {
  ensureDataDir();
  writeFileSync(CATALOG_FILE, JSON.stringify(nextCatalog, null, 2), "utf8");
}

function saveSettings(nextSettings: AppSettings) {
  ensureDataDir();
  writeFileSync(SETTINGS_FILE, JSON.stringify(nextSettings, null, 2), "utf8");
}

function loadOrders(dayKey = getBusinessDayKey()) {
  ensureDataDir();

  const filePath = getOrdersFilePath(dayKey);

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content) as Order[];
  } catch {
    return [];
  }
}

function saveOrders(nextOrders: Order[], dayKey = getBusinessDayKey()) {
  ensureDataDir();
  writeFileSync(getOrdersFilePath(dayKey), JSON.stringify(nextOrders, null, 2), "utf8");
}

function getNextDailyOrderId(currentOrders: Order[]) {
  const highestSequence = currentOrders.reduce((max, order) => {
    const match = /^C-(\d{3,})$/.exec(order.id);

    if (!match) {
      return max;
    }

    const sequence = Number(match[1]);
    return Number.isNaN(sequence) ? max : Math.max(max, sequence);
  }, 0);

  return `C-${String(highestSequence + 1).padStart(3, "0")}`;
}

function buildDailySummary(currentOrders: Order[]) {
  const totalRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
  const byStatus = {
    pending: currentOrders.filter((order) => order.status === "pending").length,
    preparing: currentOrders.filter((order) => order.status === "preparing").length,
    ready: currentOrders.filter((order) => order.status === "ready").length,
    delivered: currentOrders.filter((order) => order.status === "delivered").length,
  };
  const bySource = {
    tablet: currentOrders.filter((order) => order.source === "tablet").length,
    pos: currentOrders.filter((order) => order.source === "pos").length,
  };

  return {
    businessDay: getBusinessDayKey(),
    orderCount: currentOrders.length,
    totalRevenue,
    byStatus,
    bySource,
  };
}

let orders: Order[] = loadOrders();
let settings: AppSettings = loadSettings();
let catalog: MenuCatalog = loadCatalog();

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

function getAuthToken(req: express.Request) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function requirePosAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getAuthToken(req);

  if (!token || !authTokens.has(token)) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  next();
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "burger-pos-server",
  });
});

app.get("/settings/public", (_req, res) => {
  res.json(sanitizeSettings(settings));
});

app.get("/catalog/public", (_req, res) => {
  res.json(catalog);
});

app.post("/auth/pos-login", (req, res) => {
  const { pin } = req.body as { pin?: string };

  if (!pin || pin !== settings.posPin) {
    res.status(401).json({ message: "PIN incorrecto" });
    return;
  }

  const token = randomUUID();
  authTokens.add(token);

  res.json({
    token,
    settings: sanitizeSettings(settings),
  });
});

app.get("/orders", requirePosAuth, (_req, res) => {
  res.json(orders);
});

app.get("/orders/:orderId/public", (req, res) => {
  const order = orders.find((item) => item.id === req.params.orderId);

  if (!order) {
    res.status(404).json({ message: "Pedido no encontrado" });
    return;
  }

  res.json({
    id: order.id,
    tableId: order.tableId,
    status: order.status,
    createdAt: order.createdAt,
  });
});

app.get("/orders/daily-summary", requirePosAuth, (_req, res) => {
  res.json(buildDailySummary(orders));
});

app.get("/settings", requirePosAuth, (_req, res) => {
  res.json(sanitizeSettings(settings));
});

app.get("/catalog", requirePosAuth, (_req, res) => {
  res.json(catalog);
});

app.put("/settings", requirePosAuth, (req, res) => {
  const payload = req.body as Partial<AppSettings>;

  const nextSettings: AppSettings = {
    businessName: payload.businessName?.trim() || settings.businessName,
    ticketFooter: payload.ticketFooter?.trim() || settings.ticketFooter,
    posPin: payload.posPin?.trim() || settings.posPin,
    tableLabels:
      Array.isArray(payload.tableLabels) && payload.tableLabels.length > 0
        ? payload.tableLabels.map((value) => String(value).trim()).filter(Boolean)
        : settings.tableLabels,
  };

  settings = nextSettings;
  saveSettings(settings);
  io.emit("settings:updated", sanitizeSettings(settings));
  res.json(sanitizeSettings(settings));
});

app.put("/catalog", requirePosAuth, (req, res) => {
  const payload = req.body as Partial<MenuCatalog>;

  if (!Array.isArray(payload.categories) || !Array.isArray(payload.modifierGroups) || !Array.isArray(payload.products)) {
    res.status(400).json({ message: "Catalogo invalido" });
    return;
  }

  const nextCatalog: MenuCatalog = {
    categories: payload.categories,
    modifierGroups: payload.modifierGroups,
    products: payload.products,
  };

  catalog = nextCatalog;
  saveCatalog(catalog);
  io.emit("catalog:updated", catalog);
  res.json(catalog);
});

app.post("/orders", (req, res) => {
  const payload = req.body as Partial<CreateOrderInput>;

  if (payload.source === "pos") {
    const token = getAuthToken(req);

    if (!token || !authTokens.has(token)) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }
  }

  if (!payload.tableId || !Array.isArray(payload.items) || payload.items.length === 0 || typeof payload.total !== "number") {
    res.status(400).json({ message: "Pedido invalido" });
    return;
  }

  const order: Order = {
    id: getNextDailyOrderId(orders),
    tableId: payload.tableId,
    source: payload.source === "pos" ? "pos" : "tablet",
    status: "pending",
    items: payload.items,
    total: payload.total,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);
  saveOrders(orders);
  io.emit("orders:new", order);
  io.emit("orders:summary", buildDailySummary(orders));
  res.status(201).json(order);
});

app.patch("/orders/:orderId/status", requirePosAuth, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body as { status?: OrderStatus };
  const validStatuses: OrderStatus[] = ["pending", "preparing", "ready", "delivered"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ message: "Estado invalido" });
    return;
  }

  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    res.status(404).json({ message: "Pedido no encontrado" });
    return;
  }

  order.status = status;
  saveOrders(orders);
  io.emit("orders:updated", order);
  io.emit("orders:summary", buildDailySummary(orders));
  res.json(order);
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);
  const token = typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : "";

  if (authTokens.has(token)) {
    socket.emit("orders:sync", orders);
    socket.emit("orders:summary", buildDailySummary(orders));
    socket.emit("settings:updated", sanitizeSettings(settings));
    socket.emit("catalog:updated", catalog);
  }

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = Number(process.env.PORT || 4000);

httpServer.listen(PORT, () => {
  console.log(`Server corriendo en http://localhost:${PORT}`);
});
