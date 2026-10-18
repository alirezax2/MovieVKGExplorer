<#
.SYNOPSIS
    Hard reset and reseed script for Movie Metadata Database Environment (Windows PowerShell).
.DESCRIPTION
    Tears down Docker containers, permanently removes Docker volumes, restarts services,
    and runs the 005_validation.sql script.
#>
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host "                   DATABASE RESET & RESEED SCRIPT                       " -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host " WARNING: You are about to DESTROY and REBUILD the database environment!" -ForegroundColor Red
Write-Host " - The PostgreSQL volume (movie_metadata_postgres_data) will be DELETED." -ForegroundColor Red
Write-Host " - The Metabase volume (movie_metadata_metabase_data) will be DELETED." -ForegroundColor Red
Write-Host " - All custom Metabase cards, questions, and dashboards will be ERASED." -ForegroundColor Red
Write-Host " - The database will be rebuilt and reseeded with 1,000 fresh records." -ForegroundColor Red
Write-Host "========================================================================" -ForegroundColor Yellow

if (-not $Force) {
    $confirmation = Read-Host "Are you absolutely sure you want to proceed? [y/N]"
    if ($confirmation -notmatch "^[Yy]$") {
        Write-Host "Reset aborted by user." -ForegroundColor Cyan
        exit 0
    }
}

Write-Host "`n>>> Step 1: Stopping containers and removing Docker volumes..." -ForegroundColor Cyan
docker compose down -v --remove-orphans

Write-Host "`n>>> Step 2: Starting containers with clean storage..." -ForegroundColor Cyan
docker compose up -d

Write-Host "`n>>> Step 3: Waiting for PostgreSQL service to become healthy..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 1
$healthy = $false

while ($attempt -le $maxAttempts) {
    $status = docker inspect -f '{{.State.Health.Status}}' movie-metadata-postgres 2>$null
    if ($status -eq "healthy") {
        $healthy = $true
        break
    }
    Write-Host "  Waiting for PostgreSQL (Attempt $attempt/$maxAttempts)..."
    Start-Sleep -Seconds 2
    $attempt++
}

if (-not $healthy) {
    Write-Host "ERROR: PostgreSQL failed to become healthy in time." -ForegroundColor Red
    docker compose logs postgres
    exit 1
}

Write-Host ">>> PostgreSQL is healthy and initialized!" -ForegroundColor Green

Write-Host "`n>>> Step 4: Running automated validation suite..." -ForegroundColor Cyan
docker compose exec -T postgres psql -U movie_admin -d movies_db -f /docker-entrypoint-initdb.d/005_validation.sql

Write-Host "`n========================================================================" -ForegroundColor Green
Write-Host " RESET COMPLETE! SUCCESSFUL ENVIRONMENT RESEED                           " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " PostgreSQL is running at: localhost:5425"
Write-Host " Metabase is running at:   http://localhost:3000"
Write-Host "========================================================================"
