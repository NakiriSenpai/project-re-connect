package com.ium.ium;

import android.net.Uri;

/**
 * Launcher khusus Exam dengan orientasi LANDSCAPE (dikunci di manifest).
 *
 * Diluncurkan HANYA lewat custom scheme:  ium-exam://exam/&lt;attemptId&gt;
 * dan dipetakan ke  https://&lt;host&gt;/ujian/&lt;attemptId&gt;  melalui API resmi
 * Android Browser Helper: {@link #getLaunchingUrl()}.
 *
 * Tidak ada reflection, tidak ada CustomTabsService binding manual,
 * tidak ada setRequestedOrientation() runtime.
 */
public class ExamLauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String EXAM_SCHEME = "ium-exam";

    @Override
    protected Uri getLaunchingUrl() {
        Uri data = getIntent() != null ? getIntent().getData() : null;
        if (data != null && EXAM_SCHEME.equals(data.getScheme())) {
            String attemptId = data.getLastPathSegment();
            if (attemptId != null && !attemptId.isEmpty()) {
                return Uri.parse("https://" + getString(R.string.hostName)
                        + "/ujian/" + Uri.encode(attemptId));
            }
        }
        return super.getLaunchingUrl();
    }
}
