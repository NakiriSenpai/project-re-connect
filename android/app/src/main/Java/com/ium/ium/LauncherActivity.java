/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */
package com.ium.ium;

import android.content.ComponentName;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;

import com.google.androidbrowserhelper.trusted.QualityEnforcer;
import com.google.androidbrowserhelper.trusted.TwaLauncher;

import java.lang.reflect.Field;
import java.util.Locale;

import org.json.JSONObject;

/**
 * I:UM TWA launcher with a small native orientation bridge.
 *
 * The web app starts a TWA PostMessage channel and sends only the commands
 * IUM_SET_ORIENTATION:portrait or IUM_SET_ORIENTATION:landscape.
 * The native Activity then controls the real Android screen orientation.
 */
public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String TAG = "I:UM OrientationBridge";
    private static final String WEB_ORIGIN = "https://korean-learn.jackplus91.workers.dev";
    private static final String COMMAND_PREFIX = "IUM_SET_ORIENTATION:";
    private static final String READY_MESSAGE = "IUM_ORIENTATION_BRIDGE_READY";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private CustomTabsSession customTabsSession;
    private boolean channelRequested;

    private final CustomTabsCallback customTabsCallback = new QualityEnforcer() {
        @Override
        public void onNavigationEvent(int navigationEvent, @Nullable Bundle extras) {
            super.onNavigationEvent(navigationEvent, extras);
            if (navigationEvent == NAVIGATION_FINISHED) {
                requestPostMessageChannelWithRetry(0);
            }
        }

        @Override
        public void onMessageChannelReady(@Nullable Bundle extras) {
            Log.i(TAG, "PostMessage channel ready");
            if (customTabsSession == null) {
                Log.w(TAG, "Channel ready but session is null");
                return;
            }
            customTabsSession.postMessage(READY_MESSAGE, null);
        }

        @Override
        public void onPostMessage(@NonNull String message, @Nullable Bundle extras) {
            super.onPostMessage(message, extras);
            handleOrientationCommand(message);
        }
    };

    private final CustomTabsServiceConnection customTabsServiceConnection =
            new CustomTabsServiceConnection() {
                @Override
                public void onCustomTabsServiceConnected(
                        @NonNull ComponentName name,
                        @NonNull CustomTabsClient client) {
                    client.warmup(0L);
                    Log.i(TAG, "Custom Tabs service connected: " + name.flattenToShortString());
                    // Navigation callbacks are provided by the session created by TwaLauncher.
                    // This auxiliary binding keeps Chrome's CustomTabs callbacks alive for the
                    // PostMessage bridge on android-browser-helper 2.6.2.
                }

                @Override
                public void onServiceDisconnected(@NonNull ComponentName name) {
                    Log.w(TAG, "Custom Tabs service disconnected: " + name.flattenToShortString());
                }
            };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep the app itself sensor-neutral. The exam flow explicitly chooses the orientation
        // through the native bridge; non-exam screens are controlled by the web app policy.
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);

        bindCustomTabsService();
    }

    @Override
    protected CustomTabsCallback getCustomTabsCallback() {
        return customTabsCallback;
    }

    private void bindCustomTabsService() {
        String packageName = CustomTabsClient.getPackageName(this, null);
        if (packageName == null) {
            Log.w(TAG, "No Custom Tabs provider found; native orientation bridge unavailable");
            return;
        }

        boolean bound = CustomTabsClient.bindCustomTabsServicePreservePriority(
                this, packageName, customTabsServiceConnection);
        Log.i(TAG, "Auxiliary Custom Tabs bind: " + bound + " provider=" + packageName);
    }

    private void requestPostMessageChannelWithRetry(final int attempt) {
        if (channelRequested) return;

        if (customTabsSession == null) {
            customTabsSession = reflectCustomTabsSession();
        }

        if (customTabsSession == null) {
            if (attempt < 6) {
                mainHandler.postDelayed(() -> requestPostMessageChannelWithRetry(attempt + 1), 250L);
            } else {
                Log.w(TAG, "Unable to obtain TWA CustomTabsSession for PostMessage");
            }
            return;
        }

        try {
            Uri origin = Uri.parse(WEB_ORIGIN);
            boolean requested = customTabsSession.requestPostMessageChannel(origin);
            Log.i(TAG, "PostMessage channel request: " + requested);
            channelRequested = requested;
        } catch (RuntimeException e) {
            Log.e(TAG, "PostMessage channel request failed", e);
        }
    }

    /**
     * android-browser-helper 2.6.2 does not expose the TWA session getter yet.
     * This is the documented workaround used by the library community until the
     * session accessor is available. Keep rules below preserve these field names.
     */
    @Nullable
    private CustomTabsSession reflectCustomTabsSession() {
        try {
            Field launcherField =
                    com.google.androidbrowserhelper.trusted.LauncherActivity.class
                            .getDeclaredField("mTwaLauncher");
            launcherField.setAccessible(true);
            Object twaLauncher = launcherField.get(this);
            if (!(twaLauncher instanceof TwaLauncher)) return null;

            Field sessionField = TwaLauncher.class.getDeclaredField("mSession");
            sessionField.setAccessible(true);
            Object session = sessionField.get(twaLauncher);
            if (session instanceof CustomTabsSession) {
                return (CustomTabsSession) session;
            }
        } catch (ReflectiveOperationException | RuntimeException e) {
            Log.e(TAG, "Unable to access TWA CustomTabsSession", e);
        }
        return null;
    }

    private void handleOrientationCommand(String rawMessage) {
        if (rawMessage == null) return;

        String message = rawMessage.trim();
        String requested = null;

        if (message.startsWith(COMMAND_PREFIX)) {
            requested = message.substring(COMMAND_PREFIX.length()).trim();
        } else if (message.startsWith("{")) {
            // Accept the object form too, so the native bridge remains compatible
            // if the web side serializes the command as JSON.
            try {
                JSONObject json = new JSONObject(message);
                String type = json.optString("type", "");
                if ("IUM_SET_ORIENTATION".equals(type)) {
                    requested = json.optString("orientation", "");
                }
            } catch (Exception ignored) {
                // Invalid JSON is simply ignored below.
            }
        }

        if (requested == null) {
            Log.d(TAG, "Ignoring non-orientation message: " + message);
            return;
        }

        requested = requested.toLowerCase(Locale.US);

        if ("landscape".equals(requested)) {
            Log.i(TAG, "Setting native orientation: LANDSCAPE");
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else if ("portrait".equals(requested)) {
            Log.i(TAG, "Setting native orientation: PORTRAIT");
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            Log.w(TAG, "Rejected invalid orientation command: " + requested);
        }
    }

    @Override
    protected void onDestroy() {
        channelRequested = false;
        customTabsSession = null;
        mainHandler.removeCallbacksAndMessages(null);
        try {
            unbindService(customTabsServiceConnection);
        } catch (IllegalArgumentException ignored) {
            // Service was not bound or was already disconnected.
        }
        super.onDestroy();
    }

    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }
}
