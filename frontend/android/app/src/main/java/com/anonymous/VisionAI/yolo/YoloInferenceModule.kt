package com.anonymous.VisionAI.yolo

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class YoloInferenceModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun getStatus(promise: Promise) {
    promise.resolve("Yolo native module loaded")
  }

  companion object {
    const val NAME = "YoloInferenceModule"
  }
}