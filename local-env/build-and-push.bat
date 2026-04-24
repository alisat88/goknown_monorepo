@echo off
setlocal enabledelayedexpansion

REM Define variables
set DOCKER_HUB_USERNAME=dappgenius
set APP_VERSION=%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%%time:~6,2%
set APP_VERSION=%APP_VERSION: =0%
set BACKEND_IMAGE_NAME=%DOCKER_HUB_USERNAME%/goknown-backend
set FRONTEND_IMAGE_NAME=%DOCKER_HUB_USERNAME%/goknown-frontend
set FULL_APP_IMAGE_NAME=%DOCKER_HUB_USERNAME%/goknown-full

REM Get the absolute path of the script directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

echo Building Docker images...

REM Build backend image
echo Building backend image...
cd /d "%SCRIPT_DIR%" && docker-compose -f docker-compose.build.yml build backend-build
docker tag goknown-backend:latest %BACKEND_IMAGE_NAME%:%APP_VERSION%
docker tag goknown-backend:latest %BACKEND_IMAGE_NAME%:latest

REM Build frontend image
echo Building frontend image...
cd /d "%SCRIPT_DIR%" && docker-compose -f docker-compose.build.yml build frontend-build
docker tag goknown-frontend:latest %FRONTEND_IMAGE_NAME%:%APP_VERSION%
docker tag goknown-frontend:latest %FRONTEND_IMAGE_NAME%:latest

REM Build full app image (optional)
echo Do you want to build the full app image? (y/n)
set /p build_full_app_image=

if /i "%build_full_app_image%"=="y" (
  echo Building full app image...
  cd /d "%SCRIPT_DIR%" && docker-compose -f docker-compose.build.yml build full-app-build
  docker tag goknown-full:latest %FULL_APP_IMAGE_NAME%:%APP_VERSION%
  docker tag goknown-full:latest %FULL_APP_IMAGE_NAME%:latest
)

REM Push images to Docker Hub
echo Pushing images to Docker Hub...
docker push %BACKEND_IMAGE_NAME%:%APP_VERSION%
docker push %BACKEND_IMAGE_NAME%:latest
docker push %FRONTEND_IMAGE_NAME%:%APP_VERSION%
docker push %FRONTEND_IMAGE_NAME%:latest

if /i "%build_full_app_image%"=="y" (
  docker push %FULL_APP_IMAGE_NAME%:%APP_VERSION%
  docker push %FULL_APP_IMAGE_NAME%:latest
)

echo Process completed successfully!
echo Version: %APP_VERSION% 