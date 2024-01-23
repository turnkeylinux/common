#!/bin/bash

# Function to display PHP version choices and get user input
choose_php_version() {
    echo "Select the PHP version to install:"
    echo "1) PHP 7.3"
    echo "2) PHP 7.4"
    echo "3) PHP 8.0"
    echo "4) PHP 8.1"
    echo "5) PHP 8.2"
    echo "6) PHP 8.3"
    read -p "Enter choice [1-5]: " php_choice

    case $php_choice in
        1) PHPV_NEW="7.3";;
        2) PHPV_NEW="7.4";;
        3) PHPV_NEW="8.0";;
        4) PHPV_NEW="8.1";;
        5) PHPV_NEW="8.2";;
        6) PHPV_NEW="8.3";;
        *) echo "Invalid choice. Exiting."; exit 1;;
    esac
}

# Function to check if new packages exist and exclude json if PHP version is >= 7.2
check_new_packages() {
    missing_pkgs=()
    for pkg in $PHP_NEW_PKGS; do
        if ! apt-cache show "$pkg" > /dev/null 2>&1; then
            missing_pkgs+=("$pkg")
        fi
    done

    if [ ${#missing_pkgs[@]} -ne 0 ]; then
        echo "The following packages do not exist in PHP version $PHPV_NEW: ${missing_pkgs[*]}"
        exit 1
    fi
}

# Start of the script
echo "Starting PHP upgrade script..."

# Display current PHP version
echo "Current PHP version:"
php -v

# Step 1: Set PHP version to install and collect current PHP version & packages
choose_php_version
PHPV_OLD=$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;')
PHP_OLD_PKGS=$(apt-cache policy *php${PHPV_OLD}* | grep -v "Installed: (none)" | grep "Installed:" -B1 | sed -n "\|php${PHPV_OLD}| s|^\([a-z0-9\.-]*\).*$|\1|p" | grep -v "json")
PHP_NEW_PKGS=$(echo "$PHP_OLD_PKGS" | sed "s|$PHPV_OLD|$PHPV_NEW|")

# Step 2: Set up sury.org PHP
curl -sSL https://packages.sury.org/php/README.txt | bash -x

# Step 3: Install relevant new packages
check_new_packages
echo "Installing new packages..."
apt install -y $PHP_NEW_PKGS

# Detect the web server and handle PHP module accordingly
if systemctl is-active --quiet apache2; then
    # Apache is running
    a2dismod php${PHPV_OLD}
    a2enmod php${PHPV_NEW}
    systemctl restart apache2
elif systemctl is-active --quiet nginx; then
    # Nginx is running, restart PHP-FPM if installed
    systemctl restart php${PHPV_NEW}-fpm
elif systemctl is-active --quiet lighttpd; then
    # Lighttpd is running, restart PHP-FPM if installed
    systemctl restart php${PHPV_NEW}-fpm
else
    echo "No supported web server detected. Please manually configure your web server to use the new PHP version."
fi

# Update CLI version
update-alternatives --set php /usr/bin/php${PHPV_NEW}

echo "PHP upgrade completed successfully."
