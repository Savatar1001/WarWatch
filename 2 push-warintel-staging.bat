@echo off
echo ========================================
echo  WarIntel -- Push to STAGING
echo  Branch: staging
echo  Target: github.com/Savatar1001/WarIntel
echo ========================================
set /p DESC="Change description: "
D:
cd "D:\_Development\Projects\Repos\WarIntel\WarIntel.info.dev"
git add .
git commit -m "%DESC%"
git pull --rebase origin staging
git push origin staging
echo ========================================
echo  Done. Pushed to STAGING branch.
echo ========================================
pause
