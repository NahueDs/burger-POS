# burger-POS 🍔

Sistema de pedidos en tiempo real para locales gastronómicos.

## Descripción

**burger-POS** es un sistema pensado para mejorar la experiencia de pedido en una hamburguesería o local gastronómico, permitiendo que el cliente realice su pedido desde una tablet en mesa y que el local lo reciba en tiempo real desde una PC de gestión.

El objetivo principal es agilizar la toma de pedidos, reducir errores y mejorar los tiempos de atención.

## Funcionalidades principales

- Menú digital para clientes
- Selección de productos por mesa
- Personalización de pedidos:
  - quitar ingredientes
  - agregar extras
  - elegir variantes
- Envío de pedidos en tiempo real
- Panel de recepción para el local
- Preparado para impresión de comandas térmicas
- Arquitectura orientada a uso real en entorno gastronómico

## Arquitectura del sistema

### Cliente
Interfaz táctil para que el cliente pueda:
- ver el menú
- personalizar productos
- confirmar el pedido

### Local
Panel de administración para:
- recibir pedidos en tiempo real
- visualizar número de mesa
- revisar detalle de cada pedido
- gestionar flujo de atención

### Backend
Servidor encargado de:
- recibir pedidos
- sincronizar cliente y local
- manejar la lógica de negocio
- persistir información

## Tecnologías utilizadas

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js
- **Base de datos:** SQLite
- **Comunicación:** tiempo real sobre red local

## Estado del proyecto

Proyecto en desarrollo funcional, con base operativa ya implementada y mejoras en curso sobre experiencia de usuario, gestión de pedidos e integración con impresión térmica.

## Objetivo

Desarrollar una solución práctica y escalable para negocios gastronómicos que necesiten digitalizar y optimizar su sistema de pedidos.

## Próximas mejoras

- impresión de comandas
- panel administrativo más completo
- gestión de estados del pedido
- mejoras visuales en la interfaz
- configuración de productos desde administración

## Autor

**Nahuel De Salvo**  
Desarrollo de software, automatización y soluciones tecnológicas orientadas a negocios reales.