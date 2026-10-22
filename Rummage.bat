@echo off
rem Dev launcher: runs Rummage from source without installing it.
cd /d "%~dp0"
start "" "node_modules\electron\dist\electron.exe" .
