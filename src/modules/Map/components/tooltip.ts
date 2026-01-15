import type { PickingInfo } from "@deck.gl/core";

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Tooltip function for Deck.gl map
 * Dynamically renders all properties from the hovered element as raw data
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
  if (!properties || typeof properties !== "object") {
    return null;
  }

  // Get all property keys, excluding internal deck.gl properties
  const keys = Object.keys(properties).filter((key) => !key.startsWith("_"));

  if (keys.length === 0) {
    return null;
  }

  // Build HTML dynamically with raw values
  let html = '<div style="font-family: sans-serif; font-size: 12px; color: #333;">';
  
  keys.forEach((key) => {
    const value = properties[key];
    const displayValue = JSON.stringify(value);
    html += `<div style="margin: 4px 0;"><b>${escapeHtml(key)}:</b> ${escapeHtml(displayValue)}</div>`;
  });

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
