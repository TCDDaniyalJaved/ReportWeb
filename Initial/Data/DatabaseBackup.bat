@echo off
SET db_name=Ebit              
SET db_user=sa                
SET db_password=princes      
SET backup_path=D:\technocom projects\mvc\Ebit\Initial\Data\Ebit.bak 
SET server_name=ZEESHAN-LAP\SQL2022  

REM -- Backup ka SQL command
sqlcmd -S %server_name% -U %db_user% -P %db_password% -Q "BACKUP DATABASE [%db_name%] TO DISK='%backup_path%'"

REM -- Backup complete hone par message
echo Bhai Backup complete ho gaaya haii!
pause