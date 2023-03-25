# Emal – Acquire and process scientific data with ease

Emal [az. processing] is a library for experimental data acquisition and processing. While initially developped as a building block for a data processing software, the API can be used as is with Node.js code.

The library allows to keep track of data throughout an experiment and dynamically compute derived values. It takes care of propagating the uncertainties associated with the data and derived values in a consistent way (1-sigma everywhere). On top of that, Emal computes units associated with the derived values and can fit linear or non-linear models to the data.

While it should be usable, *the library is still under heavy development* and the API could change anytime, hence why no versions will be tagged until it is stabilized.