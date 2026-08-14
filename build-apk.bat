@echo off
title Kuettu SMART POS - Compilateur APK Android

echo ============================================================
echo   KUETTU SMART POS - GENERATION DU FICHIER APK ANDROID
echo ============================================================
echo.

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\Users\Colmak\.node-bin;%PATH%"

cd /d "%~dp0android"

echo [1/2] Configuration de Java JDK 17 et verification des outils...
echo Java Home: %JAVA_HOME%
echo.

echo [2/2] Lancement de l'assemblage Gradle (assembleDebug)...
echo.
call gradlew.bat assembleDebug

echo.
echo ============================================================
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo [SUCCES] Votre fichier APK a ete genere avec succes !
    echo Emplacement : %~dp0android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo [INFO] Si une erreur de SDK Android apparait, installez Android Studio via :
    echo winget install Google.AndroidStudio
)
echo ============================================================
echo.
pause
