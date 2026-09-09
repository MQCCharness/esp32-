@echo off
chcp 65001 >nul
title ESP32-S3 AI 终端
cd /d "%~dp0"
python chat_host.py
pause
