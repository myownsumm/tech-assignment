import type { PickingInfo } from "@deck.gl/core";

/**
 * Formats revenue as currency
 */
function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null) return "N/A";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Tooltip function for Deck.gl map
 * Handles both Retail Stores (points) and Sociodemographics (polygons)
 *
 * **Why this is not a React component:**
 * This function is passed directly to deck.gl's `getTooltip` prop, which is called
 * synchronously during hover events. Using a React component here would introduce
 * unnecessary React lifecycle overhead (rendering, reconciliation, state updates)
 * on every mouse move event, causing performance degradation. By using deck.gl's
 * native tooltip API with a plain function that returns HTML strings, we avoid
 * React re-renders and maintain smooth 60fps hover interactions, especially
 * important when dealing with large datasets and frequent hover events.
 */
export function getTooltip(info: PickingInfo) {
  if (!info.object) {
    return null;
  }

  const properties = info.object.properties || info.object;
  if (!properties) {
    return null;
  }

  // Check if this is a Retail Store (has store_name)
  if (properties.store_name) {
    const storeName = properties.store_name || "Unknown Store";
    const address = properties.address || "N/A";
    const city = properties.city || "N/A";
    const revenue = formatCurrency(properties.revenue);

    return {
      html: `
        <div style="font-family: sans-serif; font-size: 12px; color: #333;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #000;">${storeName}</h3>
          <div style="margin: 4px 0;">Address: ${address}</div>
          <div style="margin: 4px 0;">City: ${city}</div>
          <div style="margin: 4px 0;">Revenue: <b>${revenue}</b></div>
        </div>
      `,
      style: {
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        border: "1px solid #e0e0e0",
        maxWidth: "250px",
      },
    };
  }

  // Otherwise, it's a polygon (Sociodemographics)
  // Display available properties, prioritizing total_pop if it exists
  const keys = Object.keys(properties);
  const displayKeys = keys.slice(0, 5); // Show first 5 properties

  let html = '<div style="font-family: sans-serif; font-size: 12px; color: #333;">';
  
  // Prioritize total_pop if it exists
  if (properties.total_pop !== undefined) {
    html += `<h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #000;">Population: ${properties.total_pop.toLocaleString()}</h3>`;
  }

  // Display other relevant properties
  const otherKeys = displayKeys.filter(
    (key) => key !== "total_pop" && properties[key] !== undefined && properties[key] !== null
  );

  if (otherKeys.length > 0) {
    otherKeys.forEach((key) => {
      const value = properties[key];
      const displayValue =
        typeof value === "number" ? value.toLocaleString() : String(value);
      html += `<div style="margin: 4px 0;"><b>${key}:</b> ${displayValue}</div>`;
    });
  }

  html += "</div>";

  return {
    html,
    style: {
      backgroundColor: "white",
      padding: "10px",
      borderRadius: "6px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      border: "1px solid #e0e0e0",
      maxWidth: "250px",
    },
  };
}
