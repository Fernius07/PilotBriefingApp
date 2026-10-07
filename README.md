# ✈️ PilotBriefingApp

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment_Ready-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

**PilotBriefingApp** es una plataforma web profesional de despacho y briefing operacional de vuelo en tiempo real, diseñada con estándares de cabina (EFB) para pilotos reales, despachadores, estudiantes de aviación y entusiastas avanzados de la simulación de vuelo (Microsoft Flight Simulator 2024/2020, X-Plane, Prepar3D, VATSIM, IVAO).

La aplicación proporciona una visión completa de la situación operativa de cualquier aeródromo del mundo en cuestión de segundos, combinando decodificación de NOTAMs mediante inteligencia analítica, meteorología aeronáutica en vivo (METAR/TAF), cálculo trigonométrico de vientos en pista, control de tráfico aéreo en directo y enlace con planes de vuelo de SimBrief.

---

## 🛰️ 100% Datos en Tiempo Real (Sin Datos Estáticos ni Mocks)

PilotBriefingApp se conecta **exclusivamente a fuentes oficiales y proveedores aeronáuticos en vivo**:

* **Meteorología (METAR / TAF / Info Aeropuerto)**: [NOAA Aviation Weather Center (AWC)](https://aviationweather.gov/).
* **NOTAMs Oficiales Internacionales**: [FAA International NOTAM System (FNS / AIM)](https://notams.aim.faa.gov/).
* **Control ATC y Tráfico Online**: [VATSIM Live Data Feed v3](https://data.vatsim.net/).
* **Planes de Vuelo Operacionales (OFP)**: [SimBrief API](https://www.simbrief.com/).

> **Garantía de Fidelidad**: Cada consulta ICAO realiza una llamada directa a los servidores aeronáuticos correspondientes. No se utilizan bases de datos locales desactualizadas ni datos ficticios.

---

## 🌟 Características Principales

### 1. 🧠 Análisis y Decodificación Inteligente de NOTAM
* **Traducción a Lenguaje Operacional**: Transforma los textos crípticos de la OACI/FAA en explicaciones claras y estructuradas en español e inglés.
* **Clasificación por Categorías**:
  * 🔴 Cierres e Inoperatividad de Pistas (`RWY`)
  * 🟠 Restricciones en Calles de Rodaje y Plataformas (`TWY/APRON`)
  * 🟡 Ayudas a la Navegación, Luces e ILS (`NAV/ILS/LIGHTING`)
  * 🔵 Obstáculos, Grúas y Trabajos de Campo (`OBST/CRANE/WORK`)
  * 🟣 Espacio Aéreo, Zonas Peligrosas y Paracaidismo (`AIRSPACE/HAZARD`)
  * ⚪ Otros Avisos Generales (`OTHER`)
* **Filtro de Severidad**: Identificación visual instantánea de avisos críticos (`CRITICAL`), importantes (`WARNING`) e informativos (`INFO`).

### 2. ⏱️ Resumen de Impacto Operacional en Vuelo (Ventana 3-4 Horas)
* **Filtrado Temporal Inteligente**: Aísla los NOTAMs que tienen impacto directo durante la jornada y el periodo de vuelo programado.
* **NOTAMs Activos Ahora**: Muestra aquellos avisos que están vigentes y afectando activamente la operación.
* **Avisos "Próximamente"**: Identifica de forma diferenciada los avisos que entrarán en vigor en las próximas 3-4 horas para evitar sorpresas durante la aproximación o el rodaje.
* **Formato Horario Zulu Estandarizado**: Cada fecha y periodo de validez se formatea rigurosamente en formato aeronáutico:
  $$\text{DD/MM/YYYY HHMMZ / HHMM LT}$$
  *(Hora Zulu militar OACI junto a la hora local correspondiente).*

### 3. 🗺️ Modal de Mapa Georreferenciado Interactivo (Leaflet Dual-Layer)
Al hacer clic sobre cualquier tarjeta de NOTAM, se despliega una interfaz de cabina en 2 columnas:
* **Representación Cartográfica de 3 Geometrías**:
  1. **Zonas Acotadas / Polígonos (`POLYGON`)**: Cuando el NOTAM define un perímetro cerrado con múltiples puntos de coordenadas (ej. áreas militares restringidas, zonas de paracaidismo, acrobacia o fuegos artificiales).
  2. **Punto Único (`POINT`)**: Para obstáculos fijos, grúas de construcción, antenas o fallos de radioayudas puntuales.
  3. **Punto con Radio de Cobertura (`CIRCLE`)**: Para avisos que definen un punto central con radio de influencia náutico (NM).
* **Capas de Mapa**:
  * **Modo Normal**: Mapa vectorial de calles y relieve cartográfico.
  * **Modo Satélite**: Fotografía aérea satelital de alta resolución (Esri World Imagery).
* **Ajuste Óptico de Cabina**: Encuadre automático (`fitBounds`) con acolchado de 65px para evitar cortes con los paneles flotantes.
* **Bloqueo de Desplazamiento (`Body Scroll-Lock`)**: El fondo de la aplicación permanece estático mientras el panel lateral del NOTAM ofrece desplazamiento suave para revisar todo el texto sin interferencias.

### 4. 🌦️ Meteorología Aeronáutica en Tiempo Real (METAR y TAF)
* **Categorías de Vuelo OACI/FAA**: Indicadores en color de categorías de vuelo:
  * 🟢 **VFR** (Visual Flight Rules)
  * 🔵 **MVFR** (Marginal VFR)
  * 🟡 **IFR** (Instrument Flight Rules)
  * 🟣 **LIFR** (Low IFR)
* **Detección Automática de Amenazas Ambientales**:
  * Riesgo de engelamiento estructural y requerimiento de antihielo.
  * Bancos de niebla, baja visibilidad y techos bajos.
  * Actividad convectiva, tormentas y turbulencia.
  * Componentes límite de viento cruzado.
* **Pronóstico TAF Decodificado**: Evolución temporal por grupos horarios con desglose de tendencias (TEMPO, BECMG, PROB).

### 5. 🧭 Análisis de Pistas y Cálculo de Viento
* **Cálculo Trigonométrico en Tiempo Real**: Desglose exacto para cada cabecera de pista según el METAR vigente:
  * **Headwind / Tailwind** ($V \cdot \cos(\theta)$): Viento en cara o cola.
  * **Crosswind** ($V \cdot \sin(\theta)$): Viento cruzado y dirección (izquierda o derecha).
* **Recomendación de Pista Óptima**: Señalización automática de la pista preferente con menor viento cruzado y mayor componente en cara.
* **Representación Gráfica**: Orientación magnética de la pista superpuesta con la veleta vectorial del viento.

### 6. 🎮 Integración con Simulación de Vuelo (SimBrief y VATSIM)
* **Importación SimBrief con 1 Clic**: Carga directa del plan de vuelo operacional (OFP) por nombre de usuario o Pilot ID:
  * Ruta, origen, destino, alternativo, nivel de crucero (FL), Block Fuel, tiempo en ruta y metadatos del despacho.
* **Monitoreo VATSIM en Vivo**:
  * Detección de frecuencias ATC activas (Torre, Rodadura, Salidas/Aproximación, Centro de Control).
  * Conteo de vuelos entrantes (Inbounds) y salientes (Outbounds) en tiempo real.

### 7. 🖨️ Dossier Imprimible y Modo Nocturno
* **Exportación EFB a PDF / Impresión**: Generación instantánea de un dossier técnico de despacho de vuelo limpio en blanco y negro, optimizado para portapapeles o archivo físico.
* **Modo Visión Nocturna**: Tinte rojo de cabina de alta fidelidad que preserva la visión nocturna en condiciones de poca luz.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 3, Lucide React Icons |
| **Cartografía** | Leaflet 1.9, OpenStreetMap, Esri World Imagery |
| **Backend** | Node.js (CommonJS), Express 5.2 |
| **Decodificadores** | Algoritmos propietarios de parsing OACI/FAA para NOTAM, METAR y TAF |
| **Despliegue** | Vercel (Frontend estático de alto rendimiento + Serverless Functions para Express) |

---

## 📂 Estructura del Proyecto

```text
PilotBriefingApp/
├── api/
│   └── index.js             # Entrada Serverless de Express para Vercel
├── public/                  # Favicon y recursos estáticos
├── server/
│   ├── app.js               # Instancia central de Express y rutas API
│   ├── index.js             # Punto de entrada para ejecución local independiente
│   ├── services/
│   │   ├── weatherService.js   # Cliente API NOAA METAR/TAF
│   │   ├── notamService.js     # Cliente API FAA NOTAM
│   │   ├── windCalculator.js   # Motor de cálculo trigonométrico de vientos
│   │   ├── vatsimService.js    # Conexión al feed de VATSIM
│   │   └── simbriefService.js  # Integración SimBrief OFP
│   └── utils/
│       └── notamDecoder.js     # Algoritmo de clasificación y georreferenciación
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Barra superior con reloj Zulu militar y búsqueda
│   │   ├── RouteBar.jsx            # Gestión de aeropuertos de la ruta (DEP, ARR, ALT)
│   │   ├── WeatherCard.jsx         # Tarjeta METAR/TAF y alertas climáticas
│   │   ├── RunwayWindAnalysis.jsx  # Gráfica de pistas y vientos cruzados
│   │   ├── NotamSection.jsx        # Lista de NOTAMs y resumen de impacto operacional
│   │   ├── NotamMapModal.jsx       # Modal de mapa interactivo (2 columnas, Leaflet)
│   │   ├── VatsimCard.jsx          # Panel de ATC y tráfico en vivo de VATSIM
│   │   ├── SimBriefModal.jsx       # Modal de conexión con SimBrief
│   │   └── PrintableBriefing.jsx   # Dossier de despacho listo para imprimir
│   ├── utils/
│   │   └── aviationHelpers.js      # Formateador Zulu y utilidades de vuelo
│   ├── App.jsx                     # Componente principal de la aplicación
│   ├── index.css                   # Estilos Tailwind y personalizaciones de cabina
│   └── main.jsx                    # Punto de entrada de React
├── .gitignore               # Exclusión de node_modules, dist y temporales
├── LICENSE                  # Licencia de uso propietaria (All Rights Reserved)
├── package.json             # Dependencias y scripts de construcción
├── tailwind.config.cjs      # Paleta de colores temáticos Cockpit
├── vercel.json              # Configuración de rutas y despliegue en Vercel
└── vite.config.mjs          # Configuración del bundler Vite
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
* Node.js v18.0.0 o superior instalado en el equipo.
* Gestor de paquetes `npm`.

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Fernius07/PilotBriefingApp.git
   cd PilotBriefingApp
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   * El cliente web de Vite estará disponible en `http://localhost:3000`.
   * El servidor backend de Express se ejecutará en `http://localhost:3001`.
   * Vite redirige automáticamente todas las solicitudes `/api/*` al servidor local.

4. **Construir para producción**:
   ```bash
   npm run build
   ```

---

## ☁️ Despliegue en Vercel

El proyecto incluye una configuración lista para desplegar en **Vercel** (`vercel.json` y `api/index.js`):

1. Sube tu proyecto a tu cuenta de GitHub.
2. Accede a [Vercel](https://vercel.com/) e inicia sesión.
3. Haz clic en **Add New...** > **Project** y selecciona el repositorio `Fernius07/PilotBriefingApp`.
4. Vercel detectará automáticamente el framework **Vite**:
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Haz clic en **Deploy**.
6. ¡Listo! Vercel servirá la interfaz web ultra rápida desde la CDN global y ejecutará las rutas backend `/api/*` a través de Serverless Functions con Node.js.

---

## 📄 Licencia

Copyright © 2026 **Fernius07**. Todos los derechos reservados.

Este software y su código fuente son propiedad intelectual exclusiva de **Fernius07**. Se concede a cualquier usuario el derecho a utilizar la aplicación alojada para fines personales, educativos y de simulación de vuelo. Queda estrictamente prohibida la copia, reproducción, redistribución, modificación, venta o re-alojamiento de este código fuente o partes de él sin la debida autorización por escrito del titular.

Para más detalles, consulta el archivo [LICENSE](LICENSE).

---

## ⚠️ Descargo de Responsabilidad Aeronáutica

> **USO EXCLUSIVO DE REFERENCIA Y SIMULACIÓN**: PilotBriefingApp ha sido desarrollada como herramienta de consulta rápida y apoyo a la planificación de vuelo y simulación aérea. Los pilotos al mando en vuelos reales son legalmente responsables de contrastar todos los datos con las fuentes oficiales certificadas de información aeronáutica (AIP, NOTAM de las autoridades de aviación civil correspondientes y servicios meteorológicos oficiales de navegación aérea).
