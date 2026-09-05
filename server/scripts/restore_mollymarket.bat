@echo off
REM ============================================================================
REM MOLLY MARKET - Script de Restauration PostgreSQL (pg_restore / psql)
REM ============================================================================

set PGPASSWORD=molly225
set DB_NAME=mollymarket_backend
set DB_USER=mollymarket_user
set DB_HOST=localhost
set DB_PORT=5432

if "%~1"=="" (
    echo [ERREUR] Veuillez glisser-deposer un fichier .dump ou .sql sur ce script ou passer le chemin en argument.
    echo Exemple : restore_mollymarket.bat "C:\Users\ASUS\mollymarket\backups\mollymarket_backup.dump"
    pause
    exit /b 1
)

set BACKUP_FILE=%~1
set FILE_EXT=%~x1

echo ============================================================================
echo  Restauration de %BACKUP_FILE% vers la base %DB_NAME%
echo ============================================================================

if /I "%FILE_EXT%"==".dump" (
    echo Utilisation de pg_restore (Format binaire)...
    pg_restore -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c -v "%BACKUP_FILE%"
) else (
    echo Utilisation de psql (Format texte SQL)...
    psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%BACKUP_FILE%"
)

echo.
echo Restauration terminee !
echo.
pause
