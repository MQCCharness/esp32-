@echo off
chcp 65001 >nul
title 蔡徐坤 ASCII 舞台 · ESP32-S3 串口直播
python "%~dp0viewer.py"
echo.
pause
