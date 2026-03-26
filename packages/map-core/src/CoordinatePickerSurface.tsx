import {
  Camera,
  MapView,
  MarkerView,
  type CameraRef,
  type CameraStop,
} from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { buildInitialCameraRequest } from './camera';
import type { CoordinatePickerSurfaceProps, MapCameraRequest } from './index';

const toCoordinate = (coordinate: { latitude: number; longitude: number }) =>
  [coordinate.longitude, coordinate.latitude] as [number, number];

const toCameraStop = (request: MapCameraRequest): CameraStop => {
  if (request.bounds) {
    return {
      animationDuration: request.animated === false ? 0 : 500,
      animationMode: request.animated === false ? 'moveTo' : 'easeTo',
      bounds: {
        ne: [request.bounds.east, request.bounds.north],
        sw: [request.bounds.west, request.bounds.south],
      },
    };
  }

  return {
    animationDuration: request.animated === false ? 0 : 500,
    animationMode: request.animated === false ? 'moveTo' : 'easeTo',
    ...(request.center ? { centerCoordinate: toCoordinate(request.center) } : {}),
    ...(typeof request.zoom === 'number' ? { zoomLevel: request.zoom } : {}),
  };
};

export function CoordinatePickerSurface({
  onChange,
  palette,
  selectedCoordinate,
  style,
  testID = 'coordinate-picker-surface',
  viewport,
}: CoordinatePickerSurfaceProps) {
  const cameraRef = useRef<CameraRef>(null);

  useEffect(() => {
    if (!selectedCoordinate) {
      return;
    }

    cameraRef.current?.setCamera(
      toCameraStop({
        animated: true,
        center: selectedCoordinate,
        zoom: viewport.zoom ?? 10,
      }),
    );
  }, [selectedCoordinate, viewport.zoom]);

  return (
    <MapView
      attributionEnabled={false}
      compassEnabled={false}
      localizeLabels
      logoEnabled={false}
      onPress={(event) => {
        const coordinates =
          event.geometry?.type === 'Point'
            ? (event.geometry.coordinates as [number, number] | undefined)
            : undefined;

        if (!coordinates) {
          return;
        }

        onChange?.({
          coordinate: {
            latitude: coordinates[1],
            longitude: coordinates[0],
          },
          source: 'map',
        });
      }}
      pitchEnabled={false}
      rotateEnabled={false}
      style={[{ flex: 1 } satisfies ViewStyle, style]}
      testID={testID}
    >
      <Camera defaultSettings={toCameraStop(buildInitialCameraRequest(viewport))} ref={cameraRef} />

      {selectedCoordinate ? (
        <MarkerView coordinate={toCoordinate(selectedCoordinate)}>
          <Pressable testID={`${testID}-marker`}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 40,
                minWidth: 40,
              }}
            >
              <View
                style={{
                  backgroundColor: palette.selectedRing,
                  borderColor: palette.outline,
                  borderRadius: 12,
                  borderWidth: 2,
                  height: 24,
                  width: 24,
                }}
              />
            </View>
          </Pressable>
        </MarkerView>
      ) : null}
    </MapView>
  );
}
