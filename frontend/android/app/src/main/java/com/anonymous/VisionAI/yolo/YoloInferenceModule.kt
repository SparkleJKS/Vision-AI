package com.anonymous.VisionAI.yolo

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class YoloInferenceModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @Volatile
  private var isModelInitialized = false

  @ReactMethod
  fun initializeModel(promise: Promise) {
    if (isModelInitialized) {
      promise.resolve("ready")
      return
    }

    // Real model loading will be added in STEP 3
    isModelInitialized = true
    promise.resolve("ready")
  }

  @ReactMethod
  fun startDetection() {
    // Stub: will start inference loop later
  }

  @ReactMethod
  fun stopDetection() {
    // Stub: will stop inference loop later
  }

  companion object {
    const val NAME = "YoloInferenceModule"
  }
}