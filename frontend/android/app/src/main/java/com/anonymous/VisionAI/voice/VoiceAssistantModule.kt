package com.anonymous.VisionAI.voice

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class VoiceAssistantModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), RecognitionListener, LifecycleEventListener {

  private val mainHandler = Handler(Looper.getMainLooper())
  @Volatile private var speechRecognizer: SpeechRecognizer? = null
  @Volatile private var isListening: Boolean = false
  @Volatile private var localeTag: String = Locale.getDefault().toLanguageTag()

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun isAvailable(promise: Promise) {
    runOnMainThread {
      promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactApplicationContext))
    }
  }

  @ReactMethod
  fun getNativeBuildTag(promise: Promise) {
    promise.resolve("voice-native-v3")
  }

  @ReactMethod
  fun startListening(requestedLocaleTag: String?, promise: Promise) {
    runOnMainThread {
      if (hostActivity() == null) {
        emitError(0, "Voice recognition is unavailable because no active screen is attached.")
        promise.reject("VOICE_ACTIVITY_UNAVAILABLE", "No active Activity available for speech recognition.")
        return@runOnMainThread
      }

      if (!SpeechRecognizer.isRecognitionAvailable(reactApplicationContext)) {
        emitError(0, "Speech recognition is not available on this device.")
        promise.reject("VOICE_UNAVAILABLE", "Speech recognition is not available on this device.")
        return@runOnMainThread
      }

      localeTag = requestedLocaleTag?.takeIf { it.isNotBlank() } ?: Locale.getDefault().toLanguageTag()

      try {
        // Recreate recognizer for each session to avoid stale thread-bound instances.
        releaseRecognizer()
        ensureRecognizer()
        val recognizer = speechRecognizer
        if (recognizer == null) {
          emitError(0, "Failed to initialize speech recognizer.")
          promise.reject("VOICE_INIT_ERROR", "Failed to initialize speech recognizer.")
          return@runOnMainThread
        }

        recognizer.cancel()
        recognizer.startListening(buildRecognizerIntent(localeTag))
        isListening = true
        emitState("listening")
        promise.resolve(true)
      } catch (securityException: SecurityException) {
        emitError(0, "Microphone permission is required for voice commands.")
        promise.reject("VOICE_PERMISSION_ERROR", securityException.message)
      } catch (error: Throwable) {
        val threadInfo = "thread=${Thread.currentThread().name}, main=${Looper.myLooper() == Looper.getMainLooper()}"
        emitError(0, "Unable to start speech recognition.")
        promise.reject("VOICE_START_ERROR", "native-v3 ${error.message} [$threadInfo]")
      }
    }
  }

  @ReactMethod
  fun stopListening(promise: Promise) {
    runOnMainThread {
      isListening = false
      try {
        speechRecognizer?.stopListening()
        speechRecognizer?.cancel()
        emitState("stopped")
        promise.resolve(true)
      } catch (error: Throwable) {
        promise.reject("VOICE_STOP_ERROR", error.message)
      }
    }
  }

  @ReactMethod
  fun destroyRecognizer(promise: Promise) {
    runOnMainThread {
      isListening = false
      releaseRecognizer()
      promise.resolve(true)
    }
  }

  override fun onReadyForSpeech(params: Bundle?) {
    emitState("ready")
  }

  override fun onBeginningOfSpeech() {
    emitState("speech")
  }

  override fun onRmsChanged(rmsdB: Float) {}

  override fun onBufferReceived(buffer: ByteArray?) {}

  override fun onEndOfSpeech() {
    emitState("processing")
  }

  override fun onError(errorCode: Int) {
    isListening = false
    emitError(errorCode, mapErrorCode(errorCode))
    emitState("idle")
  }

  override fun onResults(results: Bundle?) {
    isListening = false
    emitResult(extractTranscripts(results), true)
    emitState("idle")
  }

  override fun onPartialResults(partialResults: Bundle?) {
    emitResult(extractTranscripts(partialResults), false)
  }

  override fun onEvent(eventType: Int, params: Bundle?) {}

  override fun onHostResume() {}

  override fun onHostPause() {
    if (!isListening) return
    runOnMainThread {
      try {
        speechRecognizer?.cancel()
      } catch (_: Throwable) {}
      isListening = false
      emitState("paused")
    }
  }

  override fun onHostDestroy() {
    runOnMainThread {
      isListening = false
      releaseRecognizer()
    }
  }

  override fun invalidate() {
    runOnMainThread {
      isListening = false
      releaseRecognizer()
    }
    reactContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  private fun ensureRecognizer() {
    if (Looper.myLooper() != Looper.getMainLooper()) {
      throw IllegalStateException("ensureRecognizer must run on main thread")
    }
    if (speechRecognizer != null) return
    val context = hostActivity() ?: reactApplicationContext
    val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
    recognizer.setRecognitionListener(this)
    speechRecognizer = recognizer
  }

  private inline fun runOnMainThread(crossinline block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      block()
      return
    }
    val activity = hostActivity()
    if (activity != null) {
      activity.runOnUiThread { block() }
      return
    }
    mainHandler.post { block() }
  }

  private fun hostActivity() = reactApplicationContext.currentActivity

  private fun releaseRecognizer() {
    try {
      speechRecognizer?.setRecognitionListener(null)
      speechRecognizer?.destroy()
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to release SpeechRecognizer", error)
    } finally {
      speechRecognizer = null
    }
  }

  private fun buildRecognizerIntent(languageTag: String): Intent {
    return Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageTag)
      putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactApplicationContext.packageName)
    }
  }

  private fun extractTranscripts(results: Bundle?): List<String> {
    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: arrayListOf()
    return matches.filter { !it.isNullOrBlank() }.map { it.trim() }
  }

  private fun emitResult(alternatives: List<String>, isFinal: Boolean) {
    val payload = Arguments.createMap()
    val topTranscript = alternatives.firstOrNull() ?: ""
    payload.putString("text", topTranscript)
    payload.putBoolean("isFinal", isFinal)

    val alternativesArray = Arguments.createArray()
    for (alternative in alternatives) {
      alternativesArray.pushString(alternative)
    }
    payload.putArray("alternatives", alternativesArray)

    emitEvent(EVENT_RESULT, payload)
  }

  private fun emitError(code: Int, message: String) {
    val payload = Arguments.createMap()
    payload.putInt("code", code)
    payload.putString("message", message)
    emitEvent(EVENT_ERROR, payload)
  }

  private fun emitState(state: String) {
    val payload = Arguments.createMap()
    payload.putString("state", state)
    emitEvent(EVENT_STATE, payload)
  }

  private fun emitEvent(eventName: String, payload: com.facebook.react.bridge.WritableMap) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, payload)
  }

  private fun mapErrorCode(code: Int): String {
    return when (code) {
      SpeechRecognizer.ERROR_AUDIO -> "Audio recording error."
      SpeechRecognizer.ERROR_CLIENT -> "Client side recognition error."
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission is missing."
      SpeechRecognizer.ERROR_NETWORK -> "Network error while recognizing speech."
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout while recognizing speech."
      SpeechRecognizer.ERROR_NO_MATCH -> "No command detected. Please try again."
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer is busy."
      SpeechRecognizer.ERROR_SERVER -> "Speech recognition server error."
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout. Please try again."
      else -> "Unknown speech recognition error."
    }
  }

  companion object {
    private const val NAME = "VoiceAssistantModule"
    private const val TAG = "VoiceAssistantModule"
    private const val EVENT_RESULT = "voice_assistant_result"
    private const val EVENT_ERROR = "voice_assistant_error"
    private const val EVENT_STATE = "voice_assistant_state"
  }
}
