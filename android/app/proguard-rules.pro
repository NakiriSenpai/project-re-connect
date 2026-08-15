# I:UM TWA orientation PostMessage bridge.
# android-browser-helper 2.6.2 does not expose the TWA session getter, so
# LauncherActivity accesses these fields reflectively. Preserve their names.
-keepclassmembers class com.google.androidbrowserhelper.trusted.LauncherActivity {
    <fields>;
}
-keepclassmembers class com.google.androidbrowserhelper.trusted.TwaLauncher {
    <fields>;
}
