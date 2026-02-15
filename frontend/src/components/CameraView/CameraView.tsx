import React, { useEffect, useMemo, useState } from 'react'
import { NativeModules, Platform, StyleSheet } from 'react-native'
import {
  Camera,
  VisionCameraProxy,
  runAtTargetFps,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera'
import type { Frame } from 'react-native-vision-camera'
import type { CameraViewProps } from './types'

export function CameraView({
  style,
  isActive,
  detectionEnabled,
  facing,
  maxInferenceFps,
}: CameraViewProps) {
  const active = isActive ?? false
  const enabled = detectionEnabled ?? false
  const cameraFacing = facing ?? 'back'
  const [pluginBootstrapped, setPluginBootstrapped] = useState(Platform.OS !== 'android')
  const inferenceFps = typeof maxInferenceFps === 'number' && Number.isFinite(maxInferenceFps)
    ? Math.max(1, Math.trunc(maxInferenceFps))
    : 8

  const device = useCameraDevice(cameraFacing)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    let cancelled = false
    const yoloModule = NativeModules?.YoloInferenceModule as
      | { initializeModel?: () => Promise<unknown> | unknown }
      | undefined

    const bootstrap = async () => {
      try {
        if (typeof yoloModule?.initializeModel === 'function') {
          await yoloModule.initializeModel()
        }
      } catch {
        // Keep bootstrapping even if model init fails so plugin registration still proceeds.
      } finally {
        if (!cancelled) setPluginBootstrapped(true)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const plugin = useMemo(
    () => {
      if (!pluginBootstrapped) return null
      return VisionCameraProxy.initFrameProcessorPlugin('yoloFramePreprocess', {
        facing: cameraFacing,
      })
    },
    [cameraFacing, pluginBootstrapped],
  )

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet'
      if (!enabled || plugin == null) return
      runAtTargetFps(inferenceFps, () => {
        'worklet'
        plugin.call(frame)
      })
    },
    [enabled, inferenceFps, plugin],
  )

  if (!device) return null

  return (
    <Camera
      style={[StyleSheet.absoluteFill, style]}
      device={device}
      isActive={active}
      pixelFormat="yuv"
      frameProcessor={frameProcessor}
      video={false}
      audio={false}
    />
  )
}

export default CameraView
