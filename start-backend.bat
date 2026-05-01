@echo off
echo =====================================================
echo  Smart Campus Incident Hub - Backend Startup
echo =====================================================
echo.
echo Starting Spring Boot on http://localhost:8081/api
echo Swagger UI: http://localhost:8081/api/swagger-ui.html
echo.
cd /d "%~dp0backend"
set "PATH=%PATH%;%~dp0apache-maven-3.9.6\bin"
call mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
pause
