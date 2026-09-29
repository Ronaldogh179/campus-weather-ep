# 🌤️ Campus Weather — Asistente Meteorológico en Vanilla JS

Aplicación web frontend que implementa un asistente meteorológico completamente funcional sin dependencias de frameworks ni librerías externas. Desarrollado como parte del Ejercicio Integrador 1 de la Práctica Calificada EP de Ingeniería de Software.

## 🎯 Problema que Resuelve

Campus Weather permite a los estudiantes consultar rápidamente las condiciones meteorológicas actuales y el pronóstico extendido de diferentes ciudades para planificar actividades académicas, deportivas o viajes. Demuestra el dominio del asincronismo en JavaScript y la actualización dinámica de interfaces gráficas basándose en datos externos.

## ⚙️ Características Técnicas y Funcionalidades

* **Consumo de API Asíncrona:** Integración de la API pública *Open-Meteo* mediante el uso riguroso de `fetch()` y Promesas para obtener datos en tiempo real.
* **Gestión de Estado y Persistencia:** Lógica de negocio centralizada (`appState`). Uso de la Web Storage API (`sessionStorage`) para guardar, renderizar y eliminar ciudades favoritas, manteniendo la información estrictamente durante la sesión activa.
* **Geolocalización Nativa:** Implementación de la API `navigator.geolocation` empleando callbacks para detectar las coordenadas exactas del usuario bajo demanda.
* **Manejo Dinámico del DOM (UI/UX):**
  * Interfaz de actualización continua sin recargas de página al cambiar de ciudad.
  * Renderizado de estados visuales avanzados como *Skeleton Loading* para el estado de carga.
  * Captura robusta de errores (`.catch()`) e inyección de mensajes de fallo en el DOM para prevención de estados colgados.
* **Diseño Semántico y Adaptativo:** Estructura en HTML5 y maquetación con CSS3 utilizando Custom Properties (variables) y soporte nativo automático para **Modo Oscuro** (`prefers-color-scheme`).

## 👥 Equipo de Desarrollo

* Gonzales Jacinto Simon Ronaldo
* Clemente Salomon Gabriel David
* Paitan Chavez Diego Alberto

## 🚀 Instalación y Uso

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/Ronaldogh179/campus-weather-ep.git](https://github.com/Ronaldogh179/campus-weather-ep.git)