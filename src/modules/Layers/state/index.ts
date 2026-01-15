import { atom } from "jotai";
import { useAtomValue, useAtom } from "jotai";
import type { LayerConfig } from "@modules/Layers/types";
import { initialLayers } from "@modules/Layers/config/initialLayers";

const _layersState = atom<LayerConfig[]>(initialLayers);
const _layersListSelector = atom((get) => get(_layersState));

const _layerByIdSelector = (layerId: string) =>
  atom(
    (get) => get(_layersState).find((layer) => layer.id === layerId),
    (get, set, updates: Partial<LayerConfig>) => {
      const layers = get(_layersState);
      const currentLayer = layers.find((layer) => layer.id === layerId);
      // Automatically set fillAttribute when fillMode changes to "byValue"
      if (
        updates.fillMode === "byValue" &&
        !updates.fillAttribute &&
        currentLayer?.fillAttribute
      ) {
        updates.fillAttribute = currentLayer.fillAttribute;
      }
      set(
        _layersState,
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      );
    }
  );

export const useLayersList = () => useAtomValue(_layersListSelector);
export const useLayer = (layerId: string) =>
  useAtom(_layerByIdSelector(layerId));
