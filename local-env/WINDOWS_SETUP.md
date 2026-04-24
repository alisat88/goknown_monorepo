# GoKnown - Windows Setup Guide

This guide provides specific instructions for setting up and running GoKnown on Windows.

## Prerequisites

### 1. Docker Desktop for Windows
- Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Make sure Docker Desktop is running

### 2. WSL2 (Recommended)
For better performance, it's recommended to use WSL2:

```powershell
# Run as Administrator
wsl --install
```

### 3. Docker Desktop Settings

1. **Open Docker Desktop**
2. **Go to Settings > Resources > WSL Integration**
   - Enable "Enable integration with my default WSL distro"
   - Enable "Enable integration with additional distros" if needed

3. **Go to Settings > Resources > File Sharing**
   - Add your project directory
   - Make sure the drive where your project is located is enabled

4. **Go to Settings > General**
   - Enable "Use the WSL 2 based engine"

## Installation and Execution

### 1. Clone the Project
```cmd
git clone <repository-url>
cd goknown
```

### 2. Run the Application
```cmd
cd local-env
docker-compose up -d
```

### 3. Verify It's Working
- Frontend: http://localhost:3000
- Backend: http://localhost:3333

## Scripts for Windows

### Build and Push Images
Use the batch script instead of the shell script:

```cmd
# In the local-env directory
build-and-push.bat
```

### Prepare Build
```cmd
# In the local-env directory
prepare-build.bat
```

## Troubleshooting

### 1. Permission Error
**Problem**: "Permission denied" when running Docker commands

**Solution**:
- Run Docker Desktop as Administrator
- Check file sharing settings in Docker Desktop

### 2. Build Context Error
**Problem**: "Build context" not found

**Solution**:
- Make sure you're in the correct directory (`local-env`)
- Check if the paths in `docker-compose.yml` are correct
- Use absolute paths if necessary

### 3. Volume Error
**Problem**: Volumes are not mounted correctly

**Solution**:
- Enable file sharing in Docker Desktop
- Make sure the project is on a shared drive
- Use paths with forward slashes (/) instead of backslashes (\)

### 4. Network Error
**Problem**: Containers cannot communicate

**Solution**:
- Check if Docker network is working: `docker network ls`
- Restart Docker Desktop if necessary
- Check if ports are not being used by other services

### 5. Memory Error
**Problem**: Containers run out of memory

**Solution**:
- Increase memory allocated to Docker Desktop in Settings > Resources
- Close other applications that consume a lot of memory

## Useful Commands

### Check Container Status
```cmd
docker-compose ps
```

### View Logs
```cmd
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Real-time logs
docker-compose logs -f
```

### Stop the Application
```cmd
docker-compose down
```

### Rebuild Images
```cmd
docker-compose up --build
```

### Clean Docker
```cmd
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Clean everything (be careful!)
docker system prune -a
```

## Advanced Configuration

### 1. Using WSL2 for Development
If you're using WSL2, you can develop directly in Linux:

```bash
# In WSL2
cd /mnt/c/path/to/goknown
cd local-env
docker-compose up -d
```

### 2. Configure Environment Variables
Edit the `.env` files as needed:
- `backend.env` - Backend configurations
- `frontend.env` - Frontend configurations

### 3. Configure Proxy (if needed)
If you're behind a corporate proxy:

1. Configure the proxy in Docker Desktop
2. Add proxy settings to the `.env` files

## Performance

### Windows Optimizations
1. **Use WSL2**: Significantly improves performance
2. **Increase resources**: Allocate more CPU and memory to Docker Desktop
3. **Use SSD**: If possible, place the project on an SSD
4. **Disable antivirus**: Add the project directory to antivirus exceptions

### Monitoring
```cmd
# Check resource usage
docker stats

# Check disk space
docker system df
```

## Support

If you encounter Windows-specific issues:

1. Check if Docker Desktop is up to date
2. Consult the official Docker documentation for Windows
3. Check if WSL2 is configured correctly
4. Test with a clean Docker Desktop installation

## Important Notes

- Always use forward slashes (/) in paths, even on Windows
- Run Docker commands in PowerShell or CMD, not Git Bash
- Keep Docker Desktop updated
- Use WSL2 for better performance
- Configure file sharing properly in Docker Desktop 