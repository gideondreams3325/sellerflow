package com.sellerflow.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.emoji2.bundled.BundledEmojiCompatConfig;
import androidx.emoji2.text.EmojiCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native offline EmojiCompat initialization for robust emoji rendering across all Android versions
        try {
            if (!EmojiCompat.isConfigured()) {
                BundledEmojiCompatConfig emojiConfig = new BundledEmojiCompatConfig(this);
                emojiConfig.setReplaceAll(true);
                EmojiCompat.init(emojiConfig);
            }
        } catch (Throwable ignored) {}

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                WebSettings settings = webView.getSettings();
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setDefaultTextEncodingName("UTF-8");
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    try {
                        settings.setForceDark(WebSettings.FORCE_DARK_OFF);
                    } catch (Throwable ignored) {}
                }
                if (android.os.Build.VERSION.SDK_INT >= 33) {
                    try {
                        settings.setAlgorithmicDarkeningAllowed(false);
                    } catch (Throwable ignored) {}
                }
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);

                // Native Android Share Bridge for Reels & Videos
                webView.addJavascriptInterface(new Object() {
                    @android.webkit.JavascriptInterface
                    public void shareVideo(final String title, final String text, final String url) {
                        shareVideoWithMedia(title, text, url, null);
                    }

                    @android.webkit.JavascriptInterface
                    public void shareVideoWithMedia(final String title, final String text, final String url, final String mediaUrl) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                                    shareIntent.setType("text/plain");
                                    if (title != null && !title.trim().isEmpty()) {
                                        shareIntent.putExtra(Intent.EXTRA_SUBJECT, title.trim());
                                    }
                                    StringBuilder sb = new StringBuilder();
                                    if (text != null && !text.trim().isEmpty()) {
                                        sb.append(text.trim()).append("\n\n");
                                    }
                                    if (url != null && !url.trim().isEmpty()) {
                                        sb.append(url.trim());
                                    }
                                    if (mediaUrl != null && !mediaUrl.trim().isEmpty() && !mediaUrl.equals(url)) {
                                        sb.append("\n\n🎬 Watch direct video:\n").append(mediaUrl.trim());
                                    }
                                    shareIntent.putExtra(Intent.EXTRA_TEXT, sb.toString());
                                    Intent chooser = Intent.createChooser(shareIntent, (title != null && !title.trim().isEmpty()) ? title.trim() : "Share video via");
                                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    MainActivity.this.startActivity(chooser);
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                        });
                    }
                }, "AndroidShareBridge");
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        try {
            if (getBridge() != null) {
                getBridge().onNewIntent(intent);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }

    @Override
    public void onStop() {
        super.onStop();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }
}

