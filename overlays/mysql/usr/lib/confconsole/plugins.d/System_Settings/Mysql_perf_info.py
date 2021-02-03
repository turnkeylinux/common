'''Install MySQL Perf & Info Schemas'''
from subprocess import check_call, CalledProcessError

def run():
    msg = ('Install and enable MySQL/MariaDB Performance and Information'
           ' SysSchemas.'
           '\n\nRun this to install and enable a range of views, functions and'
           ' procedures to help MariaDB administrators get insight in to'
           ' MariaDB Database usage and aid performance tuning.'
           '\n\nOnce installed it can not be (easily) removed, but can be'
           ' disabled if need be.'
           '\n\nFor further info, please see'
           ' https://github.com/FromDual/mariadb-sys')
    r = console._wrapper('yesno', msg, 20, 60,
                             yes_label='Install',
                             no_label='Back')
    if r == 'ok':
        try:
            output = check_call(['turnkey-mysql-install-perf-info-schemas',
                                 'install'])
        except CalledProcessError:
            console.msgbox('Error', 'There was an error trying to install.')
