import {
  Camera,
  MapView,
  MarkerView,
  type CameraRef,
  type CameraStop,
} from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { buildInitialCameraRequest, buildSelectionCameraRequest } from './camera';
import { describeMarker } from './presentation';
import type { MapCameraRequest, MapMarkerDescriptor, MapSurfaceProps } from './index';

const toCoordinate = (coordinate: MapMarkerDescriptor['coordinate']) =>
  [coordinate.longitude, coordinate.latitude] as [number, number];

const toCameraStop = (request: MapCameraRequest): CameraStop => {
  const padding = request.padding
    ? {
        paddingBottom: request.padding.bottom,
        paddingLeft: request.padding.left,
        paddingRight: request.padding.right,
        paddingTop: request.padding.top,
      }
    : undefined;

  if (request.bounds) {
    return {
      animationDuration: request.animated === false ? 0 : 600,
      animationMode: request.animated === false ? 'moveTo' : 'easeTo',
      bounds: {
        ne: [request.bounds.east, request.bounds.north],
        sw: [request.bounds.west, request.bounds.south],
        ...padding,
      },
    };
  }

  return {
    animationDuration: request.animated === false ? 0 : 600,
    animationMode: request.animated === false ? 'moveTo' : 'easeTo',
    ...(request.center ? { centerCoordinate: toCoordinate(request.center) } : {}),
    ...(padding ? { padding } : {}),
    ...(typeof request.zoom === 'number' ? { zoomLevel: request.zoom } : {}),
  };
};

export function MapSurface({
  mapStyle,
  markers,
  onSelectionChange,
  palette,
  selectionPaddingBottom = 220,
  style,
  testID = 'map-surface',
  viewport,
}: MapSurfaceProps) {
  const cameraRef = useRef<CameraRef>(null);
  const selectedMarker = markers.find((marker) => marker.isSelected) ?? null;

  useEffect(() => {
    if (!selectedMarker) {
      return;
    }

    cameraRef.current?.setCamera(
      toCameraStop(buildSelectionCameraRequest(selectedMarker, selectionPaddingBottom)),
    );
  }, [selectedMarker, selectionPaddingBottom]);

  const surfaceStyle = [{ flex: 1 } satisfies ViewStyle, style];

  return (
    <MapView
      attributionEnabled={false}
      compassEnabled={false}
      localizeLabels
      logoEnabled={false}
      {...(mapStyle ? { mapStyle } : {})}
      onPress={() => onSelectionChange?.({ source: 'map', springId: null })}
      pitchEnabled={false}
      rotateEnabled={false}
      style={surfaceStyle}
      testID={testID}
    >
      <Camera
        defaultSettings={toCameraStop(buildInitialCameraRequest(viewport))}
        ref={cameraRef}
        testID={`${testID}-camera`}
      />

      {markers.map((marker) => {
        const appearance = describeMarker(marker, palette);

        return (
          <MarkerView
            allowOverlap
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={toCoordinate(marker.coordinate)}
            isSelected={marker.isSelected}
            key={marker.springId}
          >
            <Pressable
              accessibilityLabel={marker.title}
              onPress={() => onSelectionChange?.({ source: 'marker', springId: marker.springId })}
              testID={`map-marker-${marker.springId}`}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: appearance.size + appearance.ringWidth * 2,
                  minWidth: appearance.size + appearance.ringWidth * 2,
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: appearance.fillColor,
                    borderColor: appearance.borderColor,
                    borderRadius: appearance.size,
                    borderWidth: 2,
                    height: appearance.size,
                    justifyContent: 'center',
                    shadowColor: palette.outline,
                    shadowOffset: { height: 3, width: 0 },
                    shadowOpacity: 0.16,
                    shadowRadius: 6,
                    width: appearance.size,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: palette.markerSurface,
                      borderRadius: 4,
                      height: 6,
                      width: 6,
                    }}
                  />
                </View>

                {marker.isSelected ? (
                  <View
                    style={{
                      borderColor: appearance.ringColor,
                      borderRadius: appearance.size + 8,
                      borderWidth: appearance.ringWidth,
                      bottom: -4,
                      left: -4,
                      position: 'absolute',
                      right: -4,
                      top: -4,
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          </MarkerView>
        );
      })}
    </MapView>
  );
}
