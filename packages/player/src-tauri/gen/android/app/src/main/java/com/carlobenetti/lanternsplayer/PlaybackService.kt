package com.carlobenetti.lanternsplayer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle

private const val CHANNEL_ID = "playback"
private const val NOTIFICATION_ID = 1
private const val COVER_SIZE_PX = 512
private const val PLAYING_SPEED = 1f
private const val PAUSED_SPEED = 0f
private const val ACTION_PREFIX = "com.carlobenetti.lanternsplayer.media."

private const val SESSION_ACTIONS =
  PlaybackStateCompat.ACTION_PLAY or
    PlaybackStateCompat.ACTION_PAUSE or
    PlaybackStateCompat.ACTION_PLAY_PAUSE or
    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
    PlaybackStateCompat.ACTION_SEEK_TO

class PlaybackService : Service() {
  private lateinit var session: MediaSessionCompat
  private var coverCache: Pair<String, Bitmap?>? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createChannel()
    session = MediaSessionCompat(this, "LanternsPlayer").apply {
      setCallback(object : MediaSessionCompat.Callback() {
        override fun onPlay() = MediaControls.send(MediaAction.PLAY)
        override fun onPause() = MediaControls.send(MediaAction.PAUSE)
        override fun onSkipToNext() = MediaControls.send(MediaAction.NEXT)
        override fun onSkipToPrevious() = MediaControls.send(MediaAction.PREVIOUS)
        override fun onSeekTo(position: Long) = MediaControls.send(MediaAction.SEEK, position)
      })
      setSessionActivity(openAppIntent())
      isActive = true
    }
    MediaControls.onStateChanged = { render(it) }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    intent?.action?.removePrefix(ACTION_PREFIX)?.let { id ->
      MediaAction.values().firstOrNull { it.id == id }?.let { MediaControls.send(it) }
    }

    val notification = buildNotification(MediaControls.state)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    render(MediaControls.state)
    return START_NOT_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    MediaControls.onStateChanged = null
    session.isActive = false
    session.release()
    super.onDestroy()
  }

  private fun render(state: MediaState) {
    session.setMetadata(
      MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, state.title)
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, state.artist)
        .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, state.durationMs)
        .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, cover(state.coverPath))
        .build(),
    )
    session.setPlaybackState(
      PlaybackStateCompat.Builder()
        .setActions(SESSION_ACTIONS)
        .setState(
          if (state.isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
          state.positionMs,
          if (state.isPlaying) PLAYING_SPEED else PAUSED_SPEED,
        )
        .build(),
    )
    getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(state))
  }

  private fun buildNotification(state: MediaState): Notification {
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_lantern)
      .setContentTitle(if (state.hasTrack) state.title else getString(R.string.app_name))
      .setContentText(state.artist)
      .setLargeIcon(cover(state.coverPath))
      .setContentIntent(openAppIntent())
      .setOngoing(true)
      .setSilent(true)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)

    if (state.hasTrack) {
      builder
        .addAction(android.R.drawable.ic_media_previous, getString(R.string.media_previous), actionIntent(MediaAction.PREVIOUS))
        .addAction(
          if (state.isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
          getString(if (state.isPlaying) R.string.media_pause else R.string.media_play),
          actionIntent(if (state.isPlaying) MediaAction.PAUSE else MediaAction.PLAY),
        )
        .addAction(android.R.drawable.ic_media_next, getString(R.string.media_next), actionIntent(MediaAction.NEXT))
        .setStyle(MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(0, 1, 2))
    }
    return builder.build()
  }

  private fun cover(path: String?): Bitmap? {
    if (path == null) {
      return null
    }
    coverCache?.let { (cachedPath, bitmap) -> if (cachedPath == path) return bitmap }

    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, bounds)
    var sampleSize = 1
    while (bounds.outWidth / (sampleSize * 2) >= COVER_SIZE_PX) {
      sampleSize *= 2
    }
    val bitmap = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sampleSize })
    coverCache = path to bitmap
    return bitmap
  }

  private fun openAppIntent(): PendingIntent = PendingIntent.getActivity(
    this,
    0,
    Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
    PendingIntent.FLAG_IMMUTABLE,
  )

  private fun actionIntent(action: MediaAction): PendingIntent = PendingIntent.getService(
    this,
    action.ordinal + 1,
    Intent(this, PlaybackService::class.java).setAction(ACTION_PREFIX + action.id),
    PendingIntent.FLAG_IMMUTABLE,
  )

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel = NotificationChannel(
      CHANNEL_ID,
      getString(R.string.app_name),
      NotificationManager.IMPORTANCE_LOW,
    )
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}
