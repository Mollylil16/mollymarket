@echo off
REM ============================================================================
REM MOLLY MARKET - Script de Sauvegarde Automatique PostgreSQL (pg_dump)
REM ============================================================================

set PGPASSWORD=molly225
set DB_NAME=mollymarket_backend
set DB_USER=mollymarket_user
set DB_HOST=localhost
set DB_PORT=5432
set BACKUP_DIR=%~dp0..\..\backups

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set DATE=%%c%%b%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
set TIMESTAMP=%DATE%_%TIME%

echo ============================================================================
echo  Lancement de la sauvegarde de la base de donnees %DB_NAME%
echo ============================================================================

REM 1. Sauvegarde au format Custom binaire (.dump - recommande pour pg_restore)
pg_dump -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -F c -b -v -f "%BACKUP_DIR%\mollymarket_%TIMESTAMP%.dump" %DB_NAME%

REM 2. Sauvegarde au format SQL texte (.sql - lisible dans pgAdmin ou notepad)
pg_dump -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -F p -b -v -f "%BACKUP_DIR%\mollymarket_%TIMESTAMP%.sql" %DB_NAME%

echo.
echo Sauvegarde terminee avec succes dans : %BACKUP_DIR%
echo.
pause
