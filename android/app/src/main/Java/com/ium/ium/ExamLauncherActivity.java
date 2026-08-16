package com.ium.ium;

/**
 * Launcher khusus Exam dengan orientasi LANDSCAPE.
 *
 * Activity ini memakai meta-data SCREEN_ORIENTATION = landscape, sehingga
 * Android Browser Helper meluncurkan TWA melalui
 * TrustedWebActivityIntentBuilder.setScreenOrientation("landscape").
 * Tidak ada kode kustom sama sekali — hanya konfigurasi manifest.
 */
public class ExamLauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
}
