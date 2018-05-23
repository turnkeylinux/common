# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

# If not running interactively, don't do anything
#[ -z "$PS1" ] && return

# don't put duplicate lines in the history. See bash(1) for more options
# ... or force ignoredups and ignorespace
HISTCONTROL=ignoredups:ignorespace

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# shorten current working directory to 2 last components in prompt
PROMPT_DIRTRIM=2

# If this is an xterm set the title to user@host:dir
case "$TERM" in
xterm*|rxvt*)
    PROMPT_COMMAND='echo -ne "\033]0;${USER}@${HOSTNAME}: ${PWD/$HOME/~}\007"'
    ;;
*)
    ;;
esac

if [ "$TERM" != "dumb" ]; then
    eval "`dircolors -b`"
    alias ls='ls --color=auto'
    alias ll='ls --color=auto -alF'
    alias la='ls --color=auto -A'
    alias l='ls --color=auto -CF'
    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'

    # Set a terminal prompt style (default is fancy color prompt)
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;33m\]\u@\h \[\033[01;34m\]\w\[\033[00m\]\$ '
else
    alias ls="ls -F"
    alias ll='ls -alF'
    alias la='ls -A'
    alias l='ls -CF'
    PS1='${debian_chroot:+($debian_chroot)}\u@\h \w\$ '
fi

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

run_scripts()
{
    for script in $1/*; do
        [ -x "$script" ] || continue
        . $script
    done
}

run_scripts $HOME/.bashrc.d

