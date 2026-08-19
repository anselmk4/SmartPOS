@echo off
title Kuettu Global POS - Ouverture Android Studio

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\Users\Colmak\.node-bin;%PATH%"

cd /d "%~dp0"

echo Ouverture du projet dans Android Studio...
call npx cap open android
pause
