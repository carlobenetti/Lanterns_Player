package com.carlobenetti.lanternsplayer

import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

data class MediaState(
  val hasTrack: Boolean = false,
  val title: String = "",
  val artist: String = "",
  val coverPath: String? = null,
  val isPlaying: Boolean = false,
  val positionMs: Long = 0,
  val durationMs: Long = 0,
)

enum class MediaAction(val id: String) {
  PLAY("play"),
  PAUSE("pause"),
  NEXT("next"),
  PREVIOUS("previous"),
  SEEK("seek"),
}

object MediaControls {
  private val mainThread = Handler(Looper.getMainLooper())
  private var webView: WebView? = null

  var state = MediaState()
    private set

  var onStateChanged: ((MediaState) -> Unit)? = null

  fun attach(view: WebView) {
    webView = view
    view.addJavascriptInterface(Bridge(), "LanternsMedia")
  }

  fun detach(view: WebView) {
    if (webView == view) {
      webView = null
    }
  }

  fun send(action: MediaAction, value: Long? = null) {
    val view = webView ?: return
    val argument = value?.toString() ?: "undefined"
    view.post {
      view.evaluateJavascript(
        "window.__lanternsMediaAction && window.__lanternsMediaAction('${action.id}', $argument)",
        null,
      )
    }
  }

  private class Bridge {
    @JavascriptInterface
    fun update(stateJson: String) {
      val json = JSONObject(stateJson)
      val next = MediaState(
        hasTrack = json.optBoolean("hasTrack"),
        title = json.optString("title"),
        artist = json.optString("artist"),
        coverPath = if (json.isNull("coverPath")) null else json.optString("coverPath"),
        isPlaying = json.optBoolean("isPlaying"),
        positionMs = json.optLong("positionMs"),
        durationMs = json.optLong("durationMs"),
      )
      mainThread.post {
        state = next
        onStateChanged?.invoke(next)
      }
    }
  }
}
