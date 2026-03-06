@echo off
SET db_name=DWebApp              
SET db_user=sa                
SET db_password=princes      
SET backup_path=F:\ASPNetCoreMVC_LayersWebApp 2.O\Accounting\Data\Data.bak  
SET server_name=.\Sql2022

REM -- Backup ka SQL command
sqlcmd -S %server_name% -U %db_user% -P %db_password% -Q "BACKUP DATABASE [%db_name%] TO DISK='%backup_path%'"

REM -- Message after backup completion
echo Backup has been completed successfully.
pause