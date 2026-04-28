package com.anonymous.VisionAI.ocr

import android.graphics.BitmapFactory
import android.graphics.Rect
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

class OcrModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun recognizeTextFromFile(path: String, promise: Promise) {
    if (path.isBlank()) {
      promise.reject("OCR_INVALID_PATH", "Image path is empty.")
      return
    }

    val image = try {
      loadInputImage(path)
    } catch (error: Throwable) {
      null
    }

    if (image == null) {
      promise.reject("OCR_IMAGE_LOAD_ERROR", "Failed to read image for OCR.")
      return
    }

    val latinRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    val devanagariRecognizer =
      TextRecognition.getClient(DevanagariTextRecognizerOptions.Builder().build())

    latinRecognizer
      .process(image)
      .addOnSuccessListener { latinResult ->
        devanagariRecognizer
          .process(image)
          .addOnSuccessListener { devanagariResult ->
            val chosen =
              if (devanagariResult.text.length > latinResult.text.length) {
                devanagariResult
              } else {
                latinResult
              }
            promise.resolve(toPayload(chosen))
          }
          .addOnFailureListener {
            promise.resolve(toPayload(latinResult))
          }
          .addOnCompleteListener {
            devanagariRecognizer.close()
          }
      }
      .addOnFailureListener { error ->
        devanagariRecognizer
          .process(image)
          .addOnSuccessListener { devanagariResult ->
            promise.resolve(toPayload(devanagariResult))
          }
          .addOnFailureListener { fallbackError ->
            promise.reject("OCR_PROCESS_ERROR", "Failed to process OCR text.", fallbackError)
          }
          .addOnCompleteListener {
            devanagariRecognizer.close()
          }
      }
      .addOnCompleteListener {
        latinRecognizer.close()
      }
  }

  private fun loadInputImage(path: String): InputImage? {
    val normalized = path.trim()
    if (normalized.isBlank()) return null

    val uri = toImageUri(normalized)
    if (uri != null) {
      try {
        return InputImage.fromFilePath(reactApplicationContext, uri)
      } catch (_: Throwable) {
        // Fall back to decodeFile below for file paths.
      }

      val uriPath = uri.path
      if (!uriPath.isNullOrBlank()) {
        val bitmap = BitmapFactory.decodeFile(uriPath)
        if (bitmap != null) {
          return InputImage.fromBitmap(bitmap, 0)
        }
      }
    }

    if (!normalized.startsWith("content://")) {
      val bitmap = BitmapFactory.decodeFile(normalized)
      if (bitmap != null) {
        return InputImage.fromBitmap(bitmap, 0)
      }
    }

    return null
  }

  private fun toImageUri(path: String): Uri? {
    val normalized = path.trim()
    if (normalized.isBlank()) return null
    if (normalized.startsWith("content://")) return Uri.parse(normalized)
    if (normalized.startsWith("file://")) return Uri.parse(normalized)
    val file = File(normalized)
    return Uri.fromFile(file)
  }

  private fun rectToMap(rect: Rect?) =
    Arguments.createMap().apply {
      if (rect == null) return@apply
      putDouble("left", rect.left.toDouble())
      putDouble("top", rect.top.toDouble())
      putDouble("right", rect.right.toDouble())
      putDouble("bottom", rect.bottom.toDouble())
      putDouble("width", rect.width().toDouble())
      putDouble("height", rect.height().toDouble())
    }

  private fun toPayload(result: Text) =
    Arguments.createMap().apply {
      putString("text", result.text)

      val blocksArray = Arguments.createArray()
      for (block in result.textBlocks) {
        val blockMap = Arguments.createMap()
        blockMap.putString("text", block.text)
        blockMap.putMap("bounds", rectToMap(block.boundingBox))

        val linesArray = Arguments.createArray()
        for (line in block.lines) {
          val lineMap = Arguments.createMap()
          lineMap.putString("text", line.text)
          lineMap.putMap("bounds", rectToMap(line.boundingBox))
          linesArray.pushMap(lineMap)
        }
        blockMap.putArray("lines", linesArray)
        blocksArray.pushMap(blockMap)
      }
      putArray("blocks", blocksArray)
    }

  companion object {
    private const val NAME = "OcrModule"
  }
}
