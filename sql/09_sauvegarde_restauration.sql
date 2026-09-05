-- ============================================================================
-- MOLLY MARKET - Script 09 : Sauvegarde et Restauration
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- PARTIE C DU CAHIER DES CHARGES : SAUVEGARDE COMPLÈTE
-- ============================================================================

-- =============================================
-- SAUVEGARDE COMPLÈTE (pg_dump)
-- =============================================

-- Format Custom (recommandé pour pg_restore) :
-- pg_dump -U mollymarket_user -h localhost -p 5432 -F c -b -v -f "C:\backup\mollymarket_backup.dump" mollymarket_backend

-- Format SQL (lisible en texte) :
-- pg_dump -U mollymarket_user -h localhost -p 5432 -F p -b -v -f "C:\backup\mollymarket_backup.sql" mollymarket_backend

-- Format Tar :
-- pg_dump -U mollymarket_user -h localhost -p 5432 -F t -b -v -f "C:\backup\mollymarket_backup.tar" mollymarket_backend

-- Sauvegarde uniquement du schéma (structure sans données) :
-- pg_dump -U mollymarket_user -h localhost -p 5432 -s -f "C:\backup\mollymarket_schema.sql" mollymarket_backend

-- Sauvegarde uniquement des données :
-- pg_dump -U mollymarket_user -h localhost -p 5432 -a -f "C:\backup\mollymarket_data.sql" mollymarket_backend

-- =============================================
-- RESTAURATION (pg_restore)
-- =============================================

-- Restauration depuis un fichier Custom (.dump) :
-- pg_restore -U mollymarket_user -h localhost -p 5432 -d mollymarket_backend -v "C:\backup\mollymarket_backup.dump"

-- Restauration avec nettoyage préalable (DROP + CREATE) :
-- pg_restore -U mollymarket_user -h localhost -p 5432 -d mollymarket_backend -c -v "C:\backup\mollymarket_backup.dump"

-- Restauration depuis un fichier SQL :
-- psql -U mollymarket_user -h localhost -p 5432 -d mollymarket_backend -f "C:\backup\mollymarket_backup.sql"

-- Restauration depuis Tar :
-- pg_restore -U mollymarket_user -h localhost -p 5432 -d mollymarket_backend -v "C:\backup\mollymarket_backup.tar"

-- =============================================
-- SCRIPT DE SAUVEGARDE AUTOMATISÉE (Windows)
-- =============================================
-- Créer un fichier batch (backup_mollymarket.bat) :
--
-- @echo off
-- set PGPASSWORD=molly225
-- set BACKUP_DIR=C:\backup
-- set DATE=%date:~6,4%%date:~3,2%%date:~0,2%
-- pg_dump -U mollymarket_user -h localhost -p 5432 -F c -b -v -f "%BACKUP_DIR%\mollymarket_%DATE%.dump" mollymarket_backend
-- echo Sauvegarde terminée : %BACKUP_DIR%\mollymarket_%DATE%.dump
-- pause

-- ============================================================================
-- FIN du script 09_sauvegarde_restauration.sql
-- ============================================================================
