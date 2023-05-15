# pxt-calliope-buttons

This is a fork of

Micro:bit buttons

with changes to work with Calliope Mini and its pins P1,P2 (Edge Connectors) and C16,C17 (right Grove port)

## Using this extension

* go to https://makecode.calliope.cc
* create a new program or open existing
* go to **Advanced**, **Extensions** and search for [https://github.com/MKleinSB/pxt-calliope-buttons]

## Capacitive buttons (touch)

### Click events (and others)

The button emits ``down``, ``up``, ``click``, ``long lick``
and ``hold`` events.

```blocks
input.touchP1.onEvent(TouchButtonEvent.Click, function () {
    led.plot(2, 1)
})
```

### Polling state

Use ``isTouched`` or ``value`` to query the state of the sensor.

```blocks
basic.forever(function () {
    if (input.touchP1.isTouched()) {
        led.plot(0, 0)
    } else {
        led.unplot(0, 0)
    }
})
```

## Acknowledgement

Various resources exist on the subject of capacitive touch and micro:bit:
* [blog post](https://ukbaz.github.io/howto/microbit_touch.html) from Barry Byford.
* [tutorial](https://www.bareconductive.com/make/create-a-touch-sensor-for-microbit-with-electric-paint/) from bare conductive.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
