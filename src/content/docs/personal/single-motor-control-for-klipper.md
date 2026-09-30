---
title: Single Motor Control For Klipper
description: RP2040 was over-hyped, but I kinda love how Klipper has implemented it.
sidebar:
  order: 2000
clomads:
  type: work
  section: personal
  status: concept
---
## Summary

A simple circuit board consisting of a Raspberry Pi RP2040 and a single replaceable step-stick[^1]. It would have a USB-C connector for firmware and control, plus a DC power connector and standard JST header for the motor itself. It could theoretically be in the shape of the motor itself for mounting.

## History

I've been upgrading my Ender 3v2 ever since I first got it and within a couple months I found the Klipper project and things have never been the same. I recently upgraded to a direct drive toolhead (Revo Hemera XS) leaving me with an extra motor from my old bowden extruder. I'd like it to be used as a second z-axis motor, but I'd rather it be independently controlled, which won't be possible with the Creality 4.2.2 board which is otherwise perfectly fine and I don't see any need to upgrade.

## Additional Thoughts

A while back I mentioned something about injecting PD power into USB-C cables already carrying a USB 2.0 signal, likely sourced from a USB-A port. I wonder what the possibility of this is, because this is basically a USB-C connected tool head.

Everyone is trying to send CAN up the line when we could just be figuring out how to inject proper power into a USB-C cable. TI has a wide range of PD controllers at first look, but I'd need to take a closer look.

The heater for a Revo is 40w... I think the highest I've seen is 60w for other high flow... maybe 100w exists.

I just had an absurd thought about a whole printer being wired with USB-C cables to each motor from a raspberry pi.

1. USB-C 'Power Delivery' is the standard created to allow devices to negotiate voltage and current with the charger.

[^1]: A "step-stick" is a colloquial term for small PCBs consisting of a stepper motor controller and some supporting hardware. They have had a consistent form-factor of a 2x8p 2.54mm DIP package for over a decade.
