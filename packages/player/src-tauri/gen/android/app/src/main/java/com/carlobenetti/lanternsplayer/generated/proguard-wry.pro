# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class com.carlobenetti.lanternsplayer.* {
  native <methods>;
}

-keep class com.carlobenetti.lanternsplayer.WryActivity {
  public <init>(...);

  void setWebView(com.carlobenetti.lanternsplayer.RustWebView);
  java.lang.Class getAppClass(...);
  int getId();
  java.lang.String getVersion();
  int startActivity(...);
}

-keep class com.carlobenetti.lanternsplayer.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class com.carlobenetti.lanternsplayer.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class com.carlobenetti.lanternsplayer.RustWebChromeClient,com.carlobenetti.lanternsplayer.RustWebViewClient {
  public <init>(...);
}
