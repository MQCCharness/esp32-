@echo off
chcp 65001 >nul
title ESP32-S3 MOC 2.0 一键恢复出厂固件
cd /d "%~dp0"

echo.
echo  ==============================================
echo    ESP32-S3 MOC 2.0 出厂固件一键恢复工具
echo    (HELLO STEM/嘉年创奇 · esptool v5.3.1)
echo  ==============================================
echo.
echo  请先用 USB 线连接开发板，然后按任意键开始...
pause >nul

set "PORT="
for /f "delims=" %%p in ('powershell -NoProfile -Command "$d = Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -like 'USB\VID_303A&PID_1001*' -and $_.Class -eq 'Ports' } | Select-Object -First 1; if ($d -and $d.Name -match '\((COM\d+)\)') { $Matches[1] }"') do set "PORT=%%p"

if "%PORT%"=="" (
    echo.
    echo  [错误] 未检测到 ESP32-S3 开发板！
    echo  请检查：USB 线是否插好 / 是否为数据线而非充电线
    echo  重新插拔后再次运行本程序。
    echo.
    pause
    exit /b 1
)

echo.
echo  [1/2] 已检测到开发板: %PORT% ，开始写入出厂固件...
echo  （约需 1 分钟，期间请勿拔线、勿关闭窗口）
echo.

esptool.exe --port %PORT% --baud 921600 write-flash 0x0 factory_full_4M.bin

if %errorlevel%==0 (
    echo.
    echo  [2/2] ★ 恢复成功！板子已还原为出厂状态，可以关闭本窗口。
) else (
    echo.
    echo  [失败] 写入未完成。请重新插拔 USB 线后再次运行本程序。
    echo  若多次失败，请换一根 USB 线或换一个 USB 口再试。
)
echo.
pause
