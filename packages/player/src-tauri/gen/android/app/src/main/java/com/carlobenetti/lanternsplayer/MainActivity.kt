package com.carlobenetti.lanternsplayer

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.View
import android.webkit.WebView
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

private const val PERMISSION_REQUEST_CODE = 4210

class MainActivity : TauriActivity() {
  private var askedForStorage = false
  private var askedForNotifications = false
  private var webView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
      navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
    )
    super.onCreate(savedInstanceState)
    keepContentInsideSystemBars()
    startPlaybackService()
  }

  override fun onWebViewCreate(webView: WebView) {
    this.webView = webView
    webView.settings.mediaPlaybackRequiresUserGesture = false
    MediaControls.attach(webView)
  }

  override fun onResume() {
    super.onResume()
    requestMissingPermissions()
  }

  override fun onDestroy() {
    webView?.let { MediaControls.detach(it) }
    if (isFinishing) {
      stopService(Intent(this, PlaybackService::class.java))
    }
    super.onDestroy()
  }

  private fun keepContentInsideSystemBars() {
    val content = findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
      )
      val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime())
      view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, keyboard.bottom))
      WindowInsetsCompat.CONSUMED
    }
  }

  private fun startPlaybackService() {
    ContextCompat.startForegroundService(this, Intent(this, PlaybackService::class.java))
  }

  private fun hasStorageAccess(): Boolean =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      Environment.isExternalStorageManager()
    } else {
      isGranted(Manifest.permission.READ_EXTERNAL_STORAGE)
    }

  private fun isGranted(permission: String): Boolean =
    ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

  private fun requestMissingPermissions() {
    if (!hasStorageAccess() && !askedForStorage) {
      askedForStorage = true
      requestStorageAccess()
      return
    }

    val needsNotificationPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      !isGranted(Manifest.permission.POST_NOTIFICATIONS)
    if (needsNotificationPermission && !askedForNotifications) {
      askedForNotifications = true
      requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), PERMISSION_REQUEST_CODE)
    }
  }

  private fun requestStorageAccess() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      requestPermissions(arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), PERMISSION_REQUEST_CODE)
      return
    }

    val appSettings = Intent(
      Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
      Uri.parse("package:$packageName"),
    )
    try {
      startActivity(appSettings)
    } catch (error: Exception) {
      startActivity(Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION))
    }
  }
}
