package com.anonymous.VisionAI.yolo

import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.media.Image
import android.os.SystemClock
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.ByteArrayOutputStream
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference
import java.util.Locale

class YoloInferenceModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  init {
    moduleInstance = this
    registerFrameProcessorPlugin()
  }

  /* =========================
     Interpreter (STEP 3)
     ========================= */

  @Volatile private var interpreter: Interpreter? = null
  @Volatile private var gpuDelegate: GpuDelegate? = null
  private val interpreterLock = Any()
  private val latestDetectionsRef: AtomicReference<List<DecodedDetection>> =
    AtomicReference(emptyList())
  private val latestMetricsRef: AtomicReference<PipelineMetrics> =
    AtomicReference(PipelineMetrics())
  private val skippedFramesDueCadence = AtomicLong(0L)
  private val completedInferenceCount = AtomicLong(0L)
  @Volatile private var firstInferenceCompletionTimeMs: Long = 0L

  @ReactMethod
  fun initializeModel(promise: Promise) {
    if (interpreter != null) {
      promise.resolve("already_initialized")
      return
    }

    try {
      synchronized(interpreterLock) {
        if (interpreter != null) {
          promise.resolve("already_initialized")
          return
        }

        val modelBuffer = loadModelFile(MODEL_FILE_NAME)

        val compatList = CompatibilityList()
        val loaded = if (compatList.isDelegateSupportedOnThisDevice) {
          try {
            val delegateOptions = compatList.bestOptionsForThisDevice
            val gpu = GpuDelegate(delegateOptions)
            gpuDelegate = gpu
            val opts = Interpreter.Options().apply {
              addDelegate(gpu)
              setNumThreads(2)
            }
            Log.d(TAG, "Using GPU delegate")
            Interpreter(modelBuffer, opts)
          } catch (e: Throwable) {
            Log.w(TAG, "GPU delegate failed despite compatibility check: ${e.message}")
            gpuDelegate = null
            buildCpuInterpreter(modelBuffer)
          }
        } else {
          Log.w(TAG, "GPU delegate not supported on this device, trying NNAPI")
          try {
            if (android.os.Build.VERSION.SDK_INT < 27) throw Exception("NNAPI requires API 27+")
            val opts = Interpreter.Options().apply {
              setUseNNAPI(true)
              setNumThreads(4)
            }
            Log.d(TAG, "Using NNAPI delegate")
            Interpreter(modelBuffer, opts)
          } catch (e: Throwable) {
            Log.w(TAG, "NNAPI failed: ${e.message}, falling back to CPU")
            buildCpuInterpreter(modelBuffer)
          }
        }
        interpreter = loaded

        interpreter?.let { logTensorShapes(it) }
      }
      promise.resolve("model_loaded")
    } catch (e: Throwable) {
      Log.e(TAG, "initializeModel failed", e)
      promise.reject("MODEL_INIT_ERROR", e.message ?: "unknown error")
    }
  }


  @ReactMethod fun startDetection() {}
  @ReactMethod fun stopDetection() {}

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getLatestDetections(): WritableArray {
    val result = Arguments.createArray()
    val snapshot = latestDetectionsRef.get()

    for (detection in snapshot) {
      val item = Arguments.createMap()
      item.putInt("classId", detection.classIndex)
      item.putDouble("confidence", detection.confidence.toDouble())
      item.putDouble("x1", detection.x1.toDouble())
      item.putDouble("y1", detection.y1.toDouble())
      item.putDouble("x2", detection.x2.toDouble())
      item.putDouble("y2", detection.y2.toDouble())
      result.pushMap(item)
    }

    return result
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getLatestMetrics(): com.facebook.react.bridge.WritableMap {
    val metrics = latestMetricsRef.get()
    val result = Arguments.createMap()
    result.putInt("preprocessMs", metrics.preprocessMs.toInt())
    result.putInt("inferenceMs", metrics.inferenceMs.toInt())
    result.putInt("decodeMs", metrics.decodeMs.toInt())
    result.putInt("nmsMs", metrics.nmsMs.toInt())
    result.putInt("totalMs", metrics.totalMs.toInt())
    result.putInt("skippedFrames", skippedFramesDueCadence.get().toInt())
    result.putDouble("effectiveFps", metrics.effectiveFps)
    return result
  }

  override fun invalidate() {
    synchronized(interpreterLock) {
      gpuDelegate?.close()
      gpuDelegate = null
      interpreter?.close()
      interpreter = null
    }
    latestDetectionsRef.set(emptyList())
    latestMetricsRef.set(PipelineMetrics())
    skippedFramesDueCadence.set(0L)
    completedInferenceCount.set(0L)
    firstInferenceCompletionTimeMs = 0L
    lastInferenceTimeMs = 0L
    inferenceInProgress.set(false)
    if (moduleInstance === this) moduleInstance = null
    super.invalidate()
  }

  /* =========================
     Frame preprocessing (STEP 4)
     ========================= */

  private val loggedIngress = AtomicBoolean(false)
  private val loggedPreprocess = AtomicBoolean(false)
  private val inferenceInProgress = AtomicBoolean(false)
  private val preprocessInProgress = AtomicBoolean(false)
  @Volatile private var lastInferenceTimeMs: Long = 0L

  private val inputBuffer: ByteBuffer =
    ByteBuffer.allocateDirect(
      MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT * MODEL_INPUT_CHANNELS * 4
    ).order(ByteOrder.nativeOrder())

  private val outputBuffer: Array<Array<FloatArray>> =
    Array(1) { Array(MODEL_OUTPUT_CHANNELS) { FloatArray(MODEL_OUTPUT_BOXES) } }

  private data class DecodedDetection(
    val classIndex: Int,
    val confidence: Float,
    val x1: Float,
    val y1: Float,
    val x2: Float,
    val y2: Float
  )

  private data class PipelineMetrics(
    val preprocessMs: Long = 0L,
    val inferenceMs: Long = 0L,
    val decodeMs: Long = 0L,
    val nmsMs: Long = 0L,
    val totalMs: Long = 0L,
    val effectiveFps: Double = 0.0
  )

  private fun processFrame(frame: Frame, facing: CameraFacing) {
    if (!preprocessInProgress.compareAndSet(false, true)) return

    val image = frame.image
    val rotation = orientationToRotationDegrees(frame.orientation)
    val preprocessStartMs = SystemClock.elapsedRealtime()

    try {
      if (loggedIngress.compareAndSet(false, true)) {
        Log.d(TAG, "Frame received: ${frame.width}x${frame.height}, rotation=$rotation, facing=$facing")
      }
      preprocessYuv(
        image = image,
        rotationDegrees = rotation,
        mirror = facing == CameraFacing.FRONT
      )
      if (loggedPreprocess.compareAndSet(false, true)) {
        Log.d(TAG, "Preprocessed tensor ready")
      }
      val preprocessMs = SystemClock.elapsedRealtime() - preprocessStartMs
      maybeRunInference(preprocessMs)
    } finally {
      preprocessInProgress.set(false)
    }
  }

  private fun maybeRunInference(preprocessMs: Long) {
    val nowMs = SystemClock.elapsedRealtime()
    val elapsedSinceLast = nowMs - lastInferenceTimeMs
    if (elapsedSinceLast < MIN_INFERENCE_INTERVAL_MS) {
      skippedFramesDueCadence.incrementAndGet()
      if (VERBOSE_LOGGING) Log.d(TAG, "Inference skipped (cadence): ${elapsedSinceLast}ms since last run")
      return
    }

    if (!inferenceInProgress.compareAndSet(false, true)) {
      return
    }

    try {
      val guardedNowMs = SystemClock.elapsedRealtime()
      val guardedElapsedSinceLast = guardedNowMs - lastInferenceTimeMs
      if (guardedElapsedSinceLast < MIN_INFERENCE_INTERVAL_MS) {
        skippedFramesDueCadence.incrementAndGet()
        if (VERBOSE_LOGGING) Log.d(TAG, "Inference skipped (cadence): ${guardedElapsedSinceLast}ms since last run")
        return
      }

      val localInterpreter = synchronized(interpreterLock) { interpreter }
      if (localInterpreter == null) {
        Log.d(TAG, "Skipping inference: interpreter is not initialized")
        return
      }

      lastInferenceTimeMs = guardedNowMs
      if (VERBOSE_LOGGING) Log.d(TAG, "Inference started")

      val inferenceStartMs = SystemClock.elapsedRealtime()
      localInterpreter.run(inputBuffer, outputBuffer)
      val inferenceDurationMs = SystemClock.elapsedRealtime() - inferenceStartMs
      if (VERBOSE_LOGGING) Log.d(TAG, "Inference completed in ${inferenceDurationMs}ms")

      val x = outputBuffer[0][0][0]
      val y = outputBuffer[0][1][0]
      val w = outputBuffer[0][2][0]
      val h = outputBuffer[0][3][0]
      val cls0 = outputBuffer[0][4][0]
      val cls1 = outputBuffer[0][5][0]

      if (VERBOSE_LOGGING) Log.d(TAG, "Inference run complete: output shape [1,84,8400]")
      if (VERBOSE_LOGGING) Log.d(TAG, "Output sample: x=$x, y=$y, w=$w, h=$h, cls0=$cls0, cls1=$cls1")

      val decodeStartMs = SystemClock.elapsedRealtime()
      val decodedDetections = decodeDetections(outputBuffer)
      val decodeMs = SystemClock.elapsedRealtime() - decodeStartMs
      Log.d(TAG, "Decoded detections before NMS: ${decodedDetections.size}")

      val nmsStartMs = SystemClock.elapsedRealtime()
      val nmsDetections = applyNms(decodedDetections, IOU_THRESHOLD, MAX_DETECTIONS)
      val nmsMs = SystemClock.elapsedRealtime() - nmsStartMs
      latestDetectionsRef.set(nmsDetections)
      emitDetections(nmsDetections)

      Log.d(TAG, "Detections after NMS: ${nmsDetections.size}")
      logTopDecodedDetections(nmsDetections)

      val completionTimeMs = SystemClock.elapsedRealtime()
      if (firstInferenceCompletionTimeMs == 0L) {
        firstInferenceCompletionTimeMs = completionTimeMs
      }
      val completedCount = completedInferenceCount.incrementAndGet()
      val elapsedForFps = (completionTimeMs - firstInferenceCompletionTimeMs).coerceAtLeast(1L)
      val effectiveFpsRaw =
        if (completedCount <= 1L) 0.0 else completedCount.toDouble() * 1000.0 / elapsedForFps.toDouble()
      val effectiveFps = String.format(Locale.US, "%.1f", effectiveFpsRaw).toDouble()

      val totalMs = preprocessMs + inferenceDurationMs + decodeMs + nmsMs
      latestMetricsRef.set(
        PipelineMetrics(
          preprocessMs = preprocessMs,
          inferenceMs = inferenceDurationMs,
          decodeMs = decodeMs,
          nmsMs = nmsMs,
          totalMs = totalMs,
          effectiveFps = effectiveFps
        )
      )

      if (VERBOSE_LOGGING) Log.d(TAG, "preprocess: ${preprocessMs}ms")
      if (VERBOSE_LOGGING) Log.d(TAG, "inference: ${inferenceDurationMs}ms")
      if (VERBOSE_LOGGING) Log.d(TAG, "decode: ${decodeMs}ms")
      if (VERBOSE_LOGGING) Log.d(TAG, "nms: ${nmsMs}ms")
      if (VERBOSE_LOGGING) Log.d(TAG, "total: ${totalMs}ms")
      if (VERBOSE_LOGGING) Log.d(TAG, "skipped frames: ${skippedFramesDueCadence.get()}")
      if (VERBOSE_LOGGING) Log.d(TAG, "effective fps: ${String.format(Locale.US, "%.1f", effectiveFps)}")
    } catch (e: Exception) {
      Log.e(TAG, "Inference run failed", e)
    } finally {
      inferenceInProgress.set(false)
    }
  }

  private fun decodeDetections(output: Array<Array<FloatArray>>): List<DecodedDetection> {
    val detections = ArrayList<DecodedDetection>(MODEL_OUTPUT_BOXES)
    val batch = output[0]

    for (boxIndex in 0 until MODEL_OUTPUT_BOXES) {
      val cx = batch[0][boxIndex]
      val cy = batch[1][boxIndex]
      val w = batch[2][boxIndex]
      val h = batch[3][boxIndex]

      var bestClassIndex = -1
      var bestConfidence = 0f
      for (channel in MODEL_CLASS_OFFSET until MODEL_OUTPUT_CHANNELS) {
        val score = batch[channel][boxIndex]
        if (score > bestConfidence) {
          bestConfidence = score
          bestClassIndex = channel - MODEL_CLASS_OFFSET
        }
      }

      if (bestClassIndex < 0 || bestConfidence < MIN_CONFIDENCE) continue

      val x1 = ((cx - w / 2f) * MODEL_INPUT_WIDTH).coerceIn(0f, MODEL_INPUT_WIDTH.toFloat())
      val y1 = ((cy - h / 2f) * MODEL_INPUT_HEIGHT).coerceIn(0f, MODEL_INPUT_HEIGHT.toFloat())
      val x2 = ((cx + w / 2f) * MODEL_INPUT_WIDTH).coerceIn(0f, MODEL_INPUT_WIDTH.toFloat())
      val y2 = ((cy + h / 2f) * MODEL_INPUT_HEIGHT).coerceIn(0f, MODEL_INPUT_HEIGHT.toFloat())

      detections.add(
        DecodedDetection(
          classIndex = bestClassIndex,
          confidence = bestConfidence,
          x1 = x1,
          y1 = y1,
          x2 = x2,
          y2 = y2
        )
      )
    }

    detections.sortByDescending { it.confidence }
    return detections
  }

  private fun logTopDecodedDetections(detections: List<DecodedDetection>) {
    if (detections.isEmpty()) {
      Log.d(TAG, "Decoded detections: none above confidence $MIN_CONFIDENCE")
      return
    }

    val count = minOf(MAX_LOGGED_DETECTIONS, detections.size)
    for (i in 0 until count) {
      val d = detections[i]
      Log.d(
        TAG,
        "Decoded Detection ${i + 1}: class=${d.classIndex} conf=${"%.4f".format(d.confidence)} " +
          "box=[x1=${d.x1.toInt()},y1=${d.y1.toInt()},x2=${d.x2.toInt()},y2=${d.y2.toInt()}]"
      )
    }
  }

  private fun emitDetections(detections: List<DecodedDetection>) {
    try {
      val arr = Arguments.createArray()
      for (d in detections) {
        val item = Arguments.createMap()
        item.putInt("classId", d.classIndex)
        item.putDouble("confidence", d.confidence.toDouble())
        item.putDouble("x1", d.x1.toDouble())
        item.putDouble("y1", d.y1.toDouble())
        item.putDouble("x2", d.x2.toDouble())
        item.putDouble("y2", d.y2.toDouble())
        arr.pushMap(item)
      }
      val params = Arguments.createMap()
      params.putArray("detections", arr)
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("onYoloDetections", params)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to emit detections", e)
    }
  }

  private fun applyNms(
    detections: List<DecodedDetection>,
    iouThreshold: Float,
    maxDetections: Int
  ): List<DecodedDetection> {
    if (detections.isEmpty()) return emptyList()

    val sorted = detections.sortedByDescending { it.confidence }
    val selected = ArrayList<DecodedDetection>(minOf(maxDetections, sorted.size))
    val suppressed = BooleanArray(sorted.size)

    for (i in sorted.indices) {
      if (suppressed[i]) continue

      val candidate = sorted[i]
      selected.add(candidate)
      if (selected.size >= maxDetections) break

      for (j in i + 1 until sorted.size) {
        if (suppressed[j]) continue
        if (computeIoU(candidate, sorted[j]) > iouThreshold) {
          suppressed[j] = true
        }
      }
    }

    return selected
  }

  private fun computeIoU(a: DecodedDetection, b: DecodedDetection): Float {
    val interLeft = maxOf(a.x1, b.x1)
    val interTop = maxOf(a.y1, b.y1)
    val interRight = minOf(a.x2, b.x2)
    val interBottom = minOf(a.y2, b.y2)

    val interWidth = maxOf(0f, interRight - interLeft)
    val interHeight = maxOf(0f, interBottom - interTop)
    val intersection = interWidth * interHeight

    if (intersection <= 0f) return 0f

    val areaA = maxOf(0f, a.x2 - a.x1) * maxOf(0f, a.y2 - a.y1)
    val areaB = maxOf(0f, b.x2 - b.x1) * maxOf(0f, b.y2 - b.y1)
    val union = areaA + areaB - intersection

    if (union <= 0f) return 0f
    return intersection / union
  }

  private fun preprocessYuv(
    image: Image,
    rotationDegrees: Int,
    mirror: Boolean
  ) {
    val yPlane = image.planes[0]
    val uPlane = image.planes[1]
    val vPlane = image.planes[2]
    val ySize = yPlane.buffer.remaining()
    val uSize = uPlane.buffer.remaining()
    val vSize = vPlane.buffer.remaining()
    val nv21 = ByteArray(ySize + uSize + vSize)
    yPlane.buffer.get(nv21, 0, ySize)
    vPlane.buffer.get(nv21, ySize, vSize)
    uPlane.buffer.get(nv21, ySize + vSize, uSize)

    val srcW = image.width
    val srcH = image.height
    val yuvImage = YuvImage(nv21, ImageFormat.NV21, srcW, srcH, null)
    val out = ByteArrayOutputStream()
    yuvImage.compressToJpeg(Rect(0, 0, srcW, srcH), 85, out)
    val jpegBytes = out.toByteArray()
    val rawBitmap = android.graphics.BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)
      ?: return

    val rot = normalizeRotation(rotationDegrees)
    val matrix = android.graphics.Matrix()
    if (rot != 0) matrix.postRotate(rot.toFloat())
    if (mirror) matrix.postScale(-1f, 1f, rawBitmap.width / 2f, rawBitmap.height / 2f)
    val rotated = if (rot != 0 || mirror)
      Bitmap.createBitmap(rawBitmap, 0, 0, rawBitmap.width, rawBitmap.height, matrix, false)
    else rawBitmap
    val scaled = Bitmap.createScaledBitmap(rotated, MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT, true)

    val pixels = IntArray(MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT)
    scaled.getPixels(pixels, 0, MODEL_INPUT_WIDTH, 0, 0, MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT)

    inputBuffer.rewind()
    for (px in pixels) {
      inputBuffer.putFloat(((px shr 16) and 0xFF) * INV_255)
      inputBuffer.putFloat(((px shr 8) and 0xFF) * INV_255)
      inputBuffer.putFloat((px and 0xFF) * INV_255)
    }
    inputBuffer.rewind()

    rawBitmap.recycle()
    if (rotated !== rawBitmap) rotated.recycle()
    if (scaled !== rotated) scaled.recycle()
  }

  /* =========================
     Helpers
     ========================= */

  private fun buildCpuInterpreter(modelBuffer: MappedByteBuffer): Interpreter {
    val opts = Interpreter.Options().apply { setNumThreads(4) }
    Log.d(TAG, "Using CPU (4 threads)")
    return Interpreter(modelBuffer, opts)
  }

  private fun loadModelFile(name: String): MappedByteBuffer =
    reactApplicationContext.assets.openFd(name).use {
      FileInputStream(it.fileDescriptor).channel.map(
        FileChannel.MapMode.READ_ONLY,
        it.startOffset,
        it.declaredLength
      )
    }

  private fun logTensorShapes(i: Interpreter) {
    Log.d(TAG, "Input shape: ${i.getInputTensor(0).shape().contentToString()}")
    Log.d(TAG, "Output shape: ${i.getOutputTensor(0).shape().contentToString()}")
  }

  private fun normalizeRotation(r: Int) =
    ((r % 360) + 360) % 360

  private fun orientationToRotationDegrees(o: Orientation) =
    when (o) {
      Orientation.PORTRAIT -> 0
      Orientation.LANDSCAPE_RIGHT -> 90
      Orientation.PORTRAIT_UPSIDE_DOWN -> 180
      Orientation.LANDSCAPE_LEFT -> 270
    }

  private fun clamp(v: Float) = v.coerceIn(0f, 255f)

  /* =========================
     FrameProcessor plugin
     ========================= */

  private class YoloPlugin(
    private val defaultFacing: CameraFacing
  ) : FrameProcessorPlugin() {
    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
      val module = moduleInstance ?: return null
      val facing = when ((params?.get("facing") as? String)?.lowercase()) {
        "front" -> CameraFacing.FRONT
        else -> defaultFacing
      }
      module.processFrame(frame, facing)
      return null
    }
  }

  companion object {
    const val NAME = "YoloInferenceModule"
    private const val TAG = "YoloInferenceModule"
    private const val MODEL_FILE_NAME = "yolov8n.tflite"

    private const val MODEL_INPUT_WIDTH = 320
    private const val MODEL_INPUT_HEIGHT = 320
    private const val MODEL_INPUT_CHANNELS = 3
    private const val MODEL_CLASS_OFFSET = 4
    private const val MODEL_OUTPUT_CHANNELS = 84
    private const val MODEL_OUTPUT_BOXES = 2100
    private const val MIN_CONFIDENCE = 0.25f
    private const val IOU_THRESHOLD = 0.45f
    private const val MAX_DETECTIONS = 10
    private const val TARGET_MAX_FPS = 30
    private const val MIN_INFERENCE_INTERVAL_MS = 1000L / TARGET_MAX_FPS
    private const val MAX_LOGGED_DETECTIONS = 5
    private const val INV_255 = 1f / 255f
    private const val VERBOSE_LOGGING = false

    @Volatile private var moduleInstance: YoloInferenceModule? = null
    private val registered = AtomicBoolean(false)

    private fun registerFrameProcessorPlugin() {
      if (!registered.compareAndSet(false, true)) return
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("yoloFramePreprocess") { _, opts ->
        val facing = if ((opts?.get("facing") as? String) == "front")
          CameraFacing.FRONT else CameraFacing.BACK
        YoloPlugin(facing)
      }
    }
  }

  private enum class CameraFacing { FRONT, BACK }
}
