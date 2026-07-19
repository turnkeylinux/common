Common Changelog Snippets
=========================

These changelog snippets are to assist to automagically create TurnKey Linux
appliance changelog entries which include all relevant changes- including
common changes.

This ensures that each appliance changelog is complete and standalone, but
without need to manually copy/paste shared changelog entries.

Filename & Format Specification
-------------------------------

Changelog snippet files should be named::

    COMMON/changes/COMMON_MAKFILE.changelog

Where:
    FAB_PATH            path to 'fab' directory; defaults to '/turnkey/fab/'
    COMMON              '$FAB_PATH/common/' 
    COMMON_MAKFILE      Name of common makefile in 'COMMON/mk/turnkey/'; e.g.
                        'apache' refers to 'COMMON/mk/turnkey/apache.mk'
    COMMON_CHANGELOG    Matching changelog file; e.g.:
                        'COMMON/changes/apache.changelog'
    TKL_VERSION         Numerical TurnKey Linux version; e.g. '19.0'

The contents must be formatted as per valid Debian changelog requirements. The
firstline of each new release entry should be in the following format::

```
turnkey-COMMON_MAKFILE_NAME-TKL_VERSION (1) turnkey; urgency=low
```

E.g. to reuse the foo example from above:

```
turnkey-apache-19.0 (1) turnkey; urgency=low
```

And must end with a signoff line, e.g.:

```
 -- Jeremy Davis <jeremy@turnkeylinux.org>  Tue, 01 Aug 2026 02:12:50 +0000
```


Generating Individual Appliance Changelogs
------------------------------------------

To generate the new appliance changelog format, ensure that the
'tkldev-detective' package is installed. I.e.:

```
apt update
apt install -y tkldev-detective
```

Once installed, in the base appliance build code directory (e.g.
'$FAB_PATH/products/lamp'), to create a new minor version changelog (e.g.
'18.1') run this:

```
tkldev-changelog -n
```

To create a new major version - e.g. 19.0, run this:

```
tkldev-changelog -N
```

To update an existing changelog entry:

```
tkldev-changelog -e
```

For more info, read the `tkldev-changelog --help`.

Please note that currently, tkldev-changelog only supports 'vim' text editor.
If you are unfamiliar with vim (and can't be bothered learning it - which you
probably should...), then you can use the automation of tkldev-changelog to
generate the changelog with common entries, then save and exit vim using the
following key presses::

    :wq<ENTER>

Then re-open the file with your preferred editor to add appliance specific
entries. Be careful to ensure that the format is correct - you can double check
(and update the date) with:

```
tkldev-changelog --date
```

No error messages means everything is good! :)


Future Development
------------------

It is anticipated that in future we will likely explicitly generate the
exhaustive individual appliance changelogs at build time (and individual app
devs/maintainers can just do an app specific changelog). In the meantime,
changelogs will need to be generated semi-manually.
