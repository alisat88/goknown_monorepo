@echo off
REM Copyright (C) 2026 GoKnown LLC. All rights reserved.
REM
REM This software and documentation constitute an unpublished work and contain
REM valuable trade secrets and proprietary information belonging to GoKnown LLC.
REM None of this material may be copied, duplicated, or disclosed without the
REM express written permission of GoKnown LLC.
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