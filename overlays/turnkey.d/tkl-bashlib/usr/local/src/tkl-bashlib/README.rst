TKLDev BashLib
==============

TKLDev BashLib (aka tkl-bashlib or just bashlib) is a collection of bash
functions and presets envrionment variables to assist with DRY_ TKLDev_
TurnKey GNU/Linux appliance buildcode_.

Contents
--------

It consists of an 'init.sh' file and a number of '.bash' files. 'init.sh'
is the core file that needs to be sourced in an appliance conf script prior
to use of bashlib. 'init.sh' itself contains some base env vars and functions
and will load (source) all other '.bash' files in this directory.

Usage
-----

Note that 'init'sh' is intended to be sourced, not executed directly. To
load bashlib, simply source 'init.sh' in your conf script. I.e.::

    source /usr/local/src/tkl-bashlib/init.sh

Note that bashlib functions should be available for use within any conf
script (assuming init.sh has been sourced as above). Bashlib is removed prior
to building the ISO, so can only be leveraged at build time (i.e. not in the
built ISO/installed system).

Licence
-------

As part of common_, TKLDev BashLib is licenced under GPLv3_ (or a later version
at your discretion).

Contributing
------------

The source of this code can be found locally on TKLDev within::

    ${FAB_PATH}/common/overlays/turnkey.d/tkl-bashlib

Or on GitHub, within the common_ repository, specifically
`overlays/turnkey.d/tkldev-bashlib`_.

To contribute to the development of bashlib, please open a pull request.

Generally it is desireable to only add new '.bash' files. That is because
existing appliance buildcode may depend on the current code "as is"
(including any buggy behvaiour). So please be especially careful if/when
modifying existing files and functions.

.. _DRY: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
.. _TKLDev: https://www.turnkeylinux.org/tkldev
.. _buildcode: https://github.com/turnkeylinux-apps/
.. _common: https://github.com/turnkeylinux/common
.. _GPLv3: https://www.gnu.org/licenses/gpl-3.0.en.html
.. _overlays/turnkey.d/tkldev-bashlib: https://github.com/turnkeylinux/common/tree/master/overlays/turnkey.d/tkl-bashlib
