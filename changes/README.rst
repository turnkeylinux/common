Common Changelog Snippets
=========================

These changelog snippets are to assist to automagically create exhaustive
appliance release changelog entries in TurnKey Linux v18.0+ appliances.
Previously (i.e. v17.x and before) common changes were noted only in the Core
changelog.


Filename & Format Specification
-------------------------------

Changelog snippet files should be named::

    COMMON/changes/COMMON_MAKFILE.changelog

Where COMMON is the path to common ('$FAB_PATH/common/' - defaults to
'/turnkey/fab/common/') and COMMON_MAKFILE is the name of the relevant common
makefile (in 'COMMON/mk/turnkey/'). E.g. the changelog relating to
'mk/turnkey/apache.mk' is 'changes/apache.changelog'

The contents must be formatted as per valid Debian changelog requirements. The
firstline of each new release entry should be in the following format::

    turnkey-COMMON_MAKFILE_NAME-TKL_VERSION (1) turnkey; urgency=low

E.g. to reuse the Apache example from above::

    turnkey-apache-18.0 (1) turnkey; urgency=low

And must end with a signoff line, e.g.::

     -- Jeremy Davis <jeremy@turnkeylinux.org>  Tue, 01 Aug 2023 02:12:50 +0000


Generating Individual Appliance Changelogs
------------------------------------------

To generate the new exhaustive changelog format, install the
'tkldev-detective' package. I.e.::

    apt update
    apt install -y tkldev-detective

Once installed, in the base appliance build code directory (e.g.
'$FAB_PATH/products/lamp'), to create a new minor version changelog (e.g.
'18.1') run this::

    tkldev-changelog -n

To create a new major version, run this::

    tkldev-changelog -N

To update an existing changelog entry::

    tkldev-changelog -e

For more info, read the 'tkldev-changelog' --help.

Please note that currently, tkldev-changelog only supports 'vim' text editor.
If you are unfamiliar with vim (and can't be bothered learning it - which you
probably should...), then you can use the automation of tkldev-changelog to
generate the changelog with common entries, then save and exit vim using the
following key presses::

    :wq<ENTER>

Then re-open the file with your preferred editor to add appliance specific entries.

Future Development
------------------

It is anticipated that in future we will likely explicitly generate the
exhaustive individual appliance changelogs at build time (and individual app
devs/maintainers can just do an app specific changelog). In the meantime,
changelogs will generated as needed.
