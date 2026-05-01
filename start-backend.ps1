# Smart Campus Incident Hub - Backend Startup (PowerShell)

Write-Host "====================================================="
Write-Host " Smart Campus Incident Hub - Backend Startup"
Write-Host "====================================================="
Write-Host ""
Write-Host "Starting Spring Boot on http://localhost:8081/api"
Write-Host "Swagger UI: http://localhost:8081/api/swagger-ui.html"
Write-Host ""

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$MavenPath = Join-Path $ScriptPath "apache-maven-3.9.6\bin"

# Add Maven to the current session's PATH if it's not already there
if ($env:PATH -notmatch "apache-maven") {
    $env:PATH = "$env:PATH;$MavenPath"
}

cd (Join-Path $ScriptPath "backend")
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
