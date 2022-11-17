# Part of - and requires - tkl-bashlib
# - see 'init' script in this directory for more info

# initialise mysql (mariadb) database and user
tkl_mysql_setup() {
    [[ "$#" -eq 3 ]] \
        || fatal "tkl_mysql_setup requires 3 args: DB name, username & password"

    service mysql start

    local db_name=${1}
    local db_user=${2}
    local db_pass=${3}

    mysqladmin create ${db_name}
    mysql --batch --execute "GRANT ALL PRIVILEGES
                             ON ${db_name}.*
                             TO ${db_user}@localhost
                             IDENTIFIED BY '${db_pass}';
                             flush privileges;"
    mysql --batch --execute "ALTER DATABASE ${db_name}
                             CHARACTER SET utf8mb4
                             COLLATE utf8mb4_bin;"
}
