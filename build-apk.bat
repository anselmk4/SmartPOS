@echo off
title Kuettu SMART POS - Compilateur APK Android

echo ============================================================
echo   KUETTU SMART POS - GENERATION DU FICHIER APK ANDROID
echo ============================================================
echo.

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;C:\Users\Colmak\.node-bin;%PATH%"

cd /d "%~dp0android"

echo [1/2] Configuration Java JDK 17 et Android SDK...
echo Java Home   : %JAVA_HOME%
echo Android SDK : %ANDROID_HOME%
echo.

echo [2/2] Lancement de l'assemblage Gradle (assembleDebug)...
echo.
call gradlew.bat assembleDebug

echo.
echo ============================================================
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo [SUCCES] Votre fichier APK a ete genere avec succes !
    echo.
    echo Emplacement : %~dp0android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    explorer.exe /select,"%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
) else (
    echo [ERREUR] La compilation a echoue. Verifiez les messages ci-dessus.
)
echo ============================================================
echo.
pause
