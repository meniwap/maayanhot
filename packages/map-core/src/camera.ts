import type { MapCameraRequest, MapMarkerDescriptor, MapViewport } from './index';

const DEFAULT_CAMERA_PADDING = {
  top: 24,
  right: 24,
  bottom: 24,
  left: 24,
} as const;

export function buildInitialCameraRequest(viewport: MapViewport): MapCameraRequest {
  if (viewport.center && typeof viewport.zoom === 'number') {
    return {
      animated: false,
      center: viewport.center,
      padding: DEFAULT_CAMERA_PADDING,
      zoom: viewport.zoom,
    };
  }

  return {
    animated: false,
    bounds: {
      east: viewport.east,
      north: viewport.north,
      south: viewport.south,
      west: viewport.west,
    },
    padding: DEFAULT_CAMERA_PADDING,
  };
}

export function buildSelectionCameraRequest(
  marker: MapMarkerDescriptor,
  selectionPaddingBottom = 220,
): MapCameraRequest {
  return {
    animated: true,
    center: marker.coordinate,
    padding: {
      top: 48,
      right: 48,
      bottom: selectionPaddingBottom,
      left: 48,
    },
    zoom: 13.5,
  };
}
