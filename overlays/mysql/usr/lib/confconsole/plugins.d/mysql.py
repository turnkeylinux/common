'''Configure Mysql Password'''

from os import remove
from os.path import isfile, realpath, expanduser, splitext
from subprocess import check_call, CalledProcessError

def run():

    ms_pass_path = realpath(expanduser('~/mysql_pass'))
    if isfile(ms_pass_path):
        with open(ms_pass_path, 'rb') as fob:
            ms_pass = fob.read()
    else:
        ms_pass = None


    options = [
        ('Generate Password', 'automatically generate a password'),
        ('Set Password', 'manually set a password')
    ]

    if ms_pass:
        options.append(('View Password', 'view generated password'))
    options.append(('Back', ''))

    opt = console.menu('Mysql Password', text = 'Regenerate/Set your password', choices = options)[1]

    #NOTE check call will raise CalledProcessError on non-zero exitcode
    if opt == 'Set Password':
    	check_call(['python', '/usr/lib/inithooks/bin/mysqlconf.py'])
	
    elif opt == 'Generate Password':
        check_call(['bash', '/usr/lib/inithooks/firstboot.d/35mysqlpass'])

    elif opt == 'View Password':
        console.msgbox('Mysql Password', ms_pass)

    if opt != 'Back':
        # __file__ might reference .pyc which will generate an exception in plugin.py
        # really plugin.py should accept ext-agnostic references and relative references
        return realpath(splitext(__file__)[0] + '.py')
