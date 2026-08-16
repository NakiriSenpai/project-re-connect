/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */
package com.ium.ium;

import android.net.Uri;

/**
 * I:UM TWA launcher utama (PORTRAIT).
 *
 * Selain intent HTTPS normal, activity ini juga menerima custom scheme
 * `ium-app://main/&lt;path&gt;` yang dipakai SEKALI saat ujian landscape selesai,
 * agar user kembali ke aplikasi utama dalam orientasi portrait.
 *
 * Tidak ada reflection, tidak ada CustomTabs binding manual, tidak ada
 * setRequestedOrientation() runtime.
 */
public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String APP_SCHEME = "ium-app";

    @Override
    protected Uri getLaunchingUrl() {
        Uri data = getIntent() != null ? getIntent().getData() : null;
        if (data != null && APP_SCHEME.equals(data.getScheme())) {
            String path = data.getPath();
            if (path == null || path.isEmpty()) {
                path = "/";
            }
            return Uri.parse("https://" + getString(R.string.hostName) + path);
        }
        return super.getLaunchingUrl();
    }
}
