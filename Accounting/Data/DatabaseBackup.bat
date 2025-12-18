@echo off
SET db_name=WebApp              
SET db_user=sa                
SET db_password=princes      
SET backup_path=D:\ASPNetCoreMVC_LayersWebApp\Accounting\Data\Webapp.bak  
SET server_name=.\Sql2022

REM -- Backup ka SQL command
sqlcmd -S %server_name% -U %db_user% -P %db_password% -Q "BACKUP DATABASE [%db_name%] TO DISK='%backup_path%'"

REM -- Backup complete hone par message
echo Bhai Backup complete ho gaaya haii!
pause