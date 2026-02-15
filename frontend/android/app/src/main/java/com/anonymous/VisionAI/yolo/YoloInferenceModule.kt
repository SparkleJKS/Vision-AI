package com.anonymous.VisionAI.yolo

import android.media.Image
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.concurrent.atomic.AtomicBoolean

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
  private val interpreterLock = Any()

  @ReactMethod
  fun initializeModel(promise: com.facebook.react.bridge.Promise) {
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

        val options = Interpreter.Options().apply {
          setNumThreads(4)
        }

        val modelBuffer = loadModelFile(MODEL_FILE_NAME)
        val loaded = Interpreter(modelBuffer, options)
        interpreter = loaded

        logTensorShapes(loaded)
      }

      promise.resolve("model_loaded")
    } catch (e: Exception) {
      promise.reject("MODEL_INIT_ERROR", e)
    }
  }

  @ReactMethod fun startDetection() {}
  @ReactMethod fun stopDetection() {}

  override fun invalidate() {
    synchronized(interpreterLock) {
      interpreter?.close()
      interpreter = null
    }
    if (moduleInstance === this) moduleInstance = null
    super.invalidate()
  }

  /* =========================
     Frame preprocessing (STEP 4)
     ========================= */

  private val preprocessLock = Any()
  private val loggedIngress = AtomicBoolean(false)
  private val loggedPreprocess = AtomicBoolean(false)
  private val ranOneShotInference = AtomicBoolean(false)

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

  private fun processFrame(frame: Frame, facing: CameraFacing) {
    val image = frame.image
    val rotation = orientationToRotationDegrees(frame.orientation)

    synchronized(preprocessLock) {
      if (loggedIngress.compareAndSet(false, true)) {
        Log.d(TAG, "Frame received: ${frame.width}x${frame.height}, rotation=$rotation, facing=$facing")
      }

      preprocessYuv(
        image = image,
        rotationDegrees = rotation,
        mirror = facing == CameraFacing.FRONT
      )

      if (loggedPreprocess.compareAndSet(false, true)) {
        Log.d(TAG, "Preprocessed tensor ready: [1,640,640,3]")
      }
    }

    runOneShotInference()
  }

  private fun runOneShotInference() {
    if (!ranOneShotInference.compareAndSet(false, true)) return

    val localInterpreter = synchronized(interpreterLock) { interpreter }
    if (localInterpreter == null) {
      ranOneShotInference.set(false)
      Log.d(TAG, "Skipping inference: interpreter is not initialized")
      return
    }

    inputBuffer.rewind()

    try {
      localInterpreter.run(inputBuffer, outputBuffer)

      val x = outputBuffer[0][0][0]
      val y = outputBuffer[0][1][0]
      val w = outputBuffer[0][2][0]
      val h = outputBuffer[0][3][0]
      val cls0 = outputBuffer[0][4][0]
      val cls1 = outputBuffer[0][5][0]

      Log.d(TAG, "Inference run complete: output shape [1,84,8400]")
      Log.d(TAG, "Output sample: x=$x, y=$y, w=$w, h=$h, cls0=$cls0, cls1=$cls1")
      logTopDecodedDetections(decodeDetections(outputBuffer))
    } catch (e: Exception) {
      ranOneShotInference.set(false)
      Log.e(TAG, "Inference run failed", e)
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

  private fun preprocessYuv(
    image: Image,
    rotationDegrees: Int,
    mirror: Boolean
  ) {
    val yPlane = image.planes[0]
    val uPlane = image.planes[1]
    val vPlane = image.planes[2]

    val yBuf = yPlane.buffer
    val uBuf = uPlane.buffer
    val vBuf = vPlane.buffer

    val srcW = image.width
    val srcH = image.height
    val rot = normalizeRotation(rotationDegrees)

    val rotW = if (rot == 90 || rot == 270) srcH else srcW
    val rotH = if (rot == 90 || rot == 270) srcW else srcH

    val scaleX = rotW.toFloat() / MODEL_INPUT_WIDTH
    val scaleY = rotH.toFloat() / MODEL_INPUT_HEIGHT

    inputBuffer.rewind()

    for (oy in 0 until MODEL_INPUT_HEIGHT) {
      val ry = ((oy + 0.5f) * scaleY).toInt().coerceIn(0, rotH - 1)
      for (ox in 0 until MODEL_INPUT_WIDTH) {
        var rx = ((ox + 0.5f) * scaleX).toInt().coerceIn(0, rotW - 1)
        if (mirror) rx = rotW - 1 - rx

        val (sx, sy) = when (rot) {
          90 -> Pair(ry, srcH - 1 - rx)
          180 -> Pair(srcW - 1 - rx, srcH - 1 - ry)
          270 -> Pair(srcW - 1 - ry, rx)
          else -> Pair(rx, ry)
        }

        val yIdx = sy * yPlane.rowStride + sx * yPlane.pixelStride
        val uvX = sx / 2
        val uvY = sy / 2
        val uIdx = uvY * uPlane.rowStride + uvX * uPlane.pixelStride
        val vIdx = uvY * vPlane.rowStride + uvX * vPlane.pixelStride

        val y = (yBuf.get(yIdx).toInt() and 0xFF).toFloat()
        val u = ((uBuf.get(uIdx).toInt() and 0xFF) - 128).toFloat()
        val v = ((vBuf.get(vIdx).toInt() and 0xFF) - 128).toFloat()

        val r = clamp(y + 1.402f * v) * INV_255
        val g = clamp(y - 0.344136f * u - 0.714136f * v) * INV_255
        val b = clamp(y + 1.772f * u) * INV_255

        inputBuffer.putFloat(r)
        inputBuffer.putFloat(g)
        inputBuffer.putFloat(b)
      }
    }

    inputBuffer.rewind()
  }

  /* =========================
     Helpers
     ========================= */

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

    private const val MODEL_INPUT_WIDTH = 640
    private const val MODEL_INPUT_HEIGHT = 640
    private const val MODEL_INPUT_CHANNELS = 3
    private const val MODEL_CLASS_OFFSET = 4
    private const val MODEL_OUTPUT_CHANNELS = 84
    private const val MODEL_OUTPUT_BOXES = 8400
    private const val MIN_CONFIDENCE = 0.25f
    private const val MAX_LOGGED_DETECTIONS = 5
    private const val INV_255 = 1f / 255f

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
