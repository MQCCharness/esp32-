@echo off
rem ============================================================
rem  ESP-IDF build wrapper (Git Bash compatible)
rem
rem  Why: Git Bash injects MSYSTEM=MINGW64; ESP-IDF's install.bat,
rem  export.bat, idf_tools.py and idf.py all detect and refuse it
rem  (idf_tools.py checks `if 'MSYSTEM' in os.environ` - key presence
rem  only, so assigning an empty value does NOT help). bash-side
rem  unset / env -u are overridden by the shell profile.
rem
rem  Fix: this script uses a native CMD environment and launches
rem  idf.py through run_idf_tool.py, which deletes the key inside the
rem  Python process before running the target script.
rem
rem  Usage: idf.bat <args for idf.py>   e.g.  idf.bat build
rem ============================================================

set "IDF_PATH=G:\esp\esp-idf"
set "IDF_TOOLS_PATH=G:\esp\tools"
set "OPENOCD_SCRIPTS=G:\esp\tools\tools\openocd-esp32\v0.12.0-esp32-20251215\openocd-esp32\share\openocd\scripts"
set "ESP_ROM_ELF_DIR=G:\esp\tools\tools\esp-rom-elfs\20241011\"
set "IDF_PYTHON_ENV_PATH=G:\esp\tools\python_env\idf5.5_py3.12_env"
set "IDF_CCACHE_ENABLE=1"
set "WD=G:\esp\tools\tools"
set "PATH=%WD%\xtensa-esp-elf-gdb\16.3_20250913\xtensa-esp-elf-gdb\bin;%WD%\xtensa-esp-elf\esp-14.2.0_20260121\xtensa-esp-elf\bin;%WD%\riscv32-esp-elf\esp-14.2.0_20260121\riscv32-esp-elf\bin;%WD%\esp32ulp-elf\2.38_20240113\esp32ulp-elf\bin;%WD%\cmake\3.30.2\bin;%WD%\openocd-esp32\v0.12.0-esp32-20251215\openocd-esp32\bin;%WD%\ninja\1.12.1;%WD%\idf-exe\1.0.3;%WD%\ccache\4.12.1\ccache-4.12.1-windows-x86_64;%WD%\dfu-util\0.11\dfu-util-0.11-win64;G:\esp\tools\python_env\idf5.5_py3.12_env\Scripts;G:\esp\esp-idf\tools;%PATH%"

if "%~1"=="" (
    echo Usage: idf.bat ^<idf.py args^>   e.g.  idf.bat build
    exit /b 1
)

cd /d "G:\esp\esp-claw\application\edge_agent"
"%IDF_PYTHON_ENV_PATH%\Scripts\python.exe" "G:\esp\run_idf_tool.py" "%IDF_PATH%\tools\idf.py" %*
