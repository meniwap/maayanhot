import type { MapMarkerAppearance, MapMarkerDescriptor, MapSurfacePalette } from './index';

export function describeMarker(
  marker: MapMarkerDescriptor,
  palette: MapSurfacePalette,
): MapMarkerAppearance {
  const fillColor =
    marker.waterPresence === 'water'
      ? palette.water
      : marker.waterPresence === 'no_water'
        ? palette.noWater
        : palette.unknown;

  return {
    borderColor: marker.freshness === 'stale' ? palette.stale : palette.outline,
    fillColor,
    ringColor: marker.isSelected ? palette.selectedRing : 'transparent',
    ringWidth: marker.isSelected ? 3 : 0,
    size: marker.isSelected ? 28 : 20,
  };
}
