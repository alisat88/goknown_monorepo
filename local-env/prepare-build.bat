@echo off
setlocal

REM Get the absolute path of the script directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Copy environment files to project root
copy "%SCRIPT_DIR%backend.env" "%PROJECT_ROOT%\backend.env"
copy "%SCRIPT_DIR%frontend.env" "%PROJECT_ROOT%\frontend.env"

REM Run build script
call "%SCRIPT_DIR%build-and-push.bat"

REM Clean up
del "%PROJECT_ROOT%\backend.env"
del "%PROJECT_ROOT%\frontend.env" 