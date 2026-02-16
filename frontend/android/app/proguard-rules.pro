# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native dev support (used by JNI - prevents CxxInspectorPackagerConnection ClassNotFoundException)
-keep class com.facebook.react.devsupport.** { *; }

# react-native-config: BuildConfig fields are read via reflection - must keep names for GOOGLE_WEB_CLIENT_ID etc
-keep class com.anonymous.VisionAI.BuildConfig { *; }
-keep class com.lugg.RNCConfig.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Firebase (auth, crashlytics, app)
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }

# react-native-vision-camera
-keep class com.mrousavy.** { *; }

# react-native-worklets
-keep class com.margelo.worklets.** { *; }

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
