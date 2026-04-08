# burger-POS 🍔

Sistema de pedidos en tiempo real para locales gastronómicos.

## Descripción

**burger-POS** es un sistema diseñado para optimizar la toma de pedidos en restaurantes, permitiendo que los clientes realicen sus pedidos desde una tablet en mesa y que el local los reciba instantáneamente en una PC.

El sistema está pensado para reducir errores, mejorar la velocidad de atención y digitalizar el flujo operativo.

---

## 🏗️ Arquitectura

Este proyecto está organizado como un **monorepo** utilizando `pnpm workspaces`.

### Aplicaciones incluidas:

- `tablet-app` → interfaz para el cliente (tablet en mesa)
- `pos-app` → panel del local (recepción de pedidos)
- `server` → backend que gestiona pedidos y sincronización

---

## ⚙️ Tecnologías

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js
- Base de datos: SQLite
- Gestión del proyecto: pnpm (workspaces)

---

## 🚀 Instalación y uso

### 1. Clonar repositorio

```bash
git clone https://github.com/NahueDs/burger-pos.git
cd burger-pos