@echo off
setlocal enabledelayedexpansion

REM Define variables
set DOCKER_HUB_USERNAME=dappgenius
set APP_VERSION=%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%%time:~6,2%
set APP_VERSION=%APP_VERSION: =0%
set FRONTEND_IMAGE_NAME=%DOCKER_HUB_USERNAME%/goknown-frontend

REM Get the absolute path of the script directory
set SCRIPT_DIR=%~dp0

echo Building Frontend Docker image...

REM Build frontend image
echo Building frontend image...
cd /d "%SCRIPT_DIR%" && docker build -t goknown-frontend:latest .
docker tag goknown-frontend:latest %FRONTEND_IMAGE_NAME%:%APP_VERSION%
docker tag goknown-frontend:latest %FRONTEND_IMAGE_NAME%:latest

REM Push images to Docker Hub
echo Pushing images to Docker Hub...
docker push %FRONTEND_IMAGE_NAME%:%APP_VERSION%
docker push %FRONTEND_IMAGE_NAME%:latest

echo Process completed successfully!
echo Version: %APP_VERSION% 
