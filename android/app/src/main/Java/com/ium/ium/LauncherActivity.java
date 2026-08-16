/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */
package com.ium.ium;

/**
 * I:UM TWA launcher (portrait).
 *
 * Tidak ada reflection, tidak ada CustomTabs manual binding, dan tidak ada
 * PostMessage bridge. Orientasi ditentukan sepenuhnya lewat mekanisme resmi
 * Android Browser Helper: meta-data SCREEN_ORIENTATION dibaca oleh
 * LauncherActivity dan diteruskan ke
 * TrustedWebActivityIntentBuilder.setScreenOrientation().
 */
public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
}
