# CARTO Front-End Technical Assignment

This project is a React-based geospatial application developed as part of the CARTO Front-End Engineer technical assignment. It demonstrates the ability to visualize map data, implement styling controls, and display data-driven widgets using `deck.gl` and `@deck.gl/carto`.

## Public access URL
https://tech-assignment-381985897488.europe-west1.run.app/

## Setup & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

## Tech Stack & Architecture

- **Core:** React 18, TypeScript, Vite
- **Map & Data:** `deck.gl`, `@deck.gl/carto`, `maplibre-gl`
- **UI Framework:** Material UI v5 (`@mui/material`)
- **State Management:** Jotai (Atomic state management for simplicity and performance)
- **Architecture:** Feature-based modular structure (`src/modules/*`) separating concerns into:
    - **Layers**: Configuration and state for map layers.
    - **Map**: Core map component and interaction logic.
    - **Widgets**: Data analysis components (Histogram, Viewport Stats).
    - **Layout**: Application shell and sidebar.

## Features

### 1. Map Data Layers
- **Retail Stores**: Visualized as a point layer from `carto-demo-data.demo_tables.retail_stores`.
- **Sociodemographics**: Visualized as a polygon tileset layer from `carto-demo-data.demo_tilesets.sociodemographics_usa_blockgroup`.

### 2. Styling Controls
A comprehensive sidebar allows users to customize layer visualization dynamically:
- **Fill Styling**: Switch between "Solid" color and "By Value" (data-driven) coloring.
- **Colors**: Custom ColorPicker for fill and outline colors.
- **Dimensions**: Sliders and inputs for Outline Width and Point Radius.

### 3. Interactions
- **Tooltip**: Hovering over features displays relevant attributes (e.g., store revenue, block group population).
  - *Note: The current implementation (`tooltip.ts`) uses deck.gl's native `getTooltip` API with HTML strings as a base solution. For production, consider implementing a React factory to build tooltip components with proper Material UI styling. Additionally, debouncing logic should be enabled as the `onHover` callback is triggered frequently. Further investigation into deck.gl's API capabilities for performant tooltip rendering is recommended.

### 4. Widgets (Bonus)
- **Viewport Statistics**: Dynamically aggregates data (Sum & Count) based on the current map viewport using the `widgetSource` API from the Carto module.
  - *Implementation: Uses client-side widget source (`widgetSource.getAggregations`) to aggregate data directly from loaded tiles in the viewport. This approach leverages frontend data already available in the browser, avoiding additional server requests.*
  - *Note: The current implementation (`useViewportStats.ts`) uses a polling method (interval-based) to refresh viewport statistics, as deck.gl's viewport state is not directly exposed through React props. This polling approach is debounced (500ms) to prevent excessive recalculations during map interactions. For production, this should be replaced with an event-driven approach (e.g., subscribing to `deck.onViewStateChange` or similar deck.gl lifecycle events). Additional research is required to determine the optimal recalculation triggers and ensure efficient event-driven updates without missing viewport changes.*
- **Legend Widget**: Displays color scales and data distribution (histogram) for data-driven layers, visualizing value distribution across color bins.
  - *Implementation: Uses server-side widget source via CARTO SQL API (`useCartoSql`) to count revenue legend applicable stores. This approach queries the full dataset on the server, providing accurate counts across all data regardless of current viewport visibility.*

## AI methodology
- Check [AI METHODOLOGY.md](AI METHODOLOGY.md) file.

## Notes & Limitations

- **Performance**: Large tilesets are handled efficiently by `deck.gl`, but client-side aggregations (Widgets) are debounced to prevent UI freezing during rapid map movements.
- **Data Source**: The application uses public CARTO demo data.
