
This is a small repo where I will put things imeplemented with ESHarmony Proxies. Right now, it only includes the generic wrapper `ProxyInterface` and `overloadable`, both of which run in nodejs with a modified V8 install.

## Installation of Node with ESHarmony Proxies:

Get the latest `node` from git:

    git://github.com/joyent/node.git

Modify `deps/v8/src/flag-definitions.h` on around line ~112:

    DEFINE_bool(harmony_proxies, true, "enable harmony proxies")

(*It should be `true`*)

On the node directory run:

    ./configure
    make
    make install

(*Might need `sudo`*)

## Notes:

Other things I want to do with proxies:

 - Namespaced methods (e.g. `new Thingy().data.add(...)`)
 - noSuchMethod / catch-all methods
 - Fluid overloading of methods (*DONE* = `overloadable.js`)
