@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ========================================================
echo   Օրացույցի Ստեղծիչ - InDesign CEP and UXP Installer
echo ========================================================
echo.

set "PLUGIN_ID=com.calendar.generator"
set "CEP_NAME=CalendarGenerator"
set "SOURCE_DIR=%~dp0"
set "CEP_TARGET=%APPDATA%\Adobe\CEP\extensions\%CEP_NAME%"
set "UXP_EXTERNAL=%APPDATA%\Adobe\UXP\Plugins\External\%PLUGIN_ID%"
set "UXP_EXT=%APPDATA%\Adobe\UXP\extensions\%PLUGIN_ID%"

echo [1/4] Enabling Adobe CEP PlayerDebugMode in Registry...
for %%V in (7 8 9 10 11 12) do (
    reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
)
echo       Done.
echo.

echo [2/4] Installing to CEP Extensions folder...
if exist "%CEP_TARGET%" rmdir /s /q "%CEP_TARGET%"
mkdir "%CEP_TARGET%\CSXS" "%CEP_TARGET%\css" "%CEP_TARGET%\js\libs" "%CEP_TARGET%\jsx" "%CEP_TARGET%\icons" >nul 2>&1
copy /y "%SOURCE_DIR%index.html" "%CEP_TARGET%\index.html" >nul
copy /y "%SOURCE_DIR%manifest.json" "%CEP_TARGET%\manifest.json" >nul
copy /y "%SOURCE_DIR%CSXS\manifest.xml" "%CEP_TARGET%\CSXS\manifest.xml" >nul
copy /y "%SOURCE_DIR%css\style.css" "%CEP_TARGET%\css\style.css" >nul
copy /y "%SOURCE_DIR%js\main.js" "%CEP_TARGET%\js\main.js" >nul
copy /y "%SOURCE_DIR%js\libs\CSInterface.js" "%CEP_TARGET%\js\libs\CSInterface.js" >nul
copy /y "%SOURCE_DIR%jsx\hostscript.jsx" "%CEP_TARGET%\jsx\hostscript.jsx" >nul
copy /y "%SOURCE_DIR%icons\icon.svg" "%CEP_TARGET%\icons\icon.svg" >nul
echo       Target: "%CEP_TARGET%"
echo       Done.
echo.

echo [3/4] Installing to InDesign Plug-Ins Panel (UXP)...
for %%D in ("%UXP_EXTERNAL%" "%UXP_EXT%") do (
    if exist "%%~D" rmdir /s /q "%%~D"
    mkdir "%%~D\css" "%%~D\js\libs" "%%~D\jsx" "%%~D\icons" >nul 2>&1
    copy /y "%SOURCE_DIR%index.html" "%%~D\index.html" >nul
    copy /y "%SOURCE_DIR%manifest.json" "%%~D\manifest.json" >nul
    copy /y "%SOURCE_DIR%css\style.css" "%%~D\css\style.css" >nul
    copy /y "%SOURCE_DIR%js\main.js" "%%~D\js\main.js" >nul
    copy /y "%SOURCE_DIR%js\libs\CSInterface.js" "%%~D\js\libs\CSInterface.js" >nul
    copy /y "%SOURCE_DIR%jsx\hostscript.jsx" "%%~D\jsx\hostscript.jsx" >nul
    copy /y "%SOURCE_DIR%icons\icon.svg" "%%~D\icons\icon.svg" >nul
)
echo       Target: "%UXP_EXTERNAL%"
echo       Done.
echo.

echo [4/4] Registering in InDesign UXP PluginsInfo (ID.json)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SOURCE_DIR%register_uxp.ps1"
echo       Done.
echo.

echo ========================================================
echo   Installation Complete
echo   Restart Adobe InDesign and open:
echo   Plug-Ins ^> Օրացույցի Ստեղծիչ (or Plug-Ins ^> Plugins Panel)
echo ========================================================
echo.
pause
endlocal