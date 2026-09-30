---
title: USB-C Stepper for Klipper
description: An RP2040 stepper board that gets both its data and its motor power from one USB-C cable, using USB Power Delivery.
year: 2023
status: concept
tags:
  - klipper
  - rp2040
  - usb-c
  - usb-pd
redirect_from:
  - concepts/single-motor-control-for-klipper
---

## Summary

A small board with an RP2040 and one replaceable stepper driver (a step-stick[^1]), connected to the printer's host with a single USB-C cable. The RP2040 runs Klipper's MCU firmware, so Klipper treats it as one more controller it can drive. A USB Power Delivery[^2] controller on the board asks the power source for a higher voltage than USB's 5 V, so the same cable that carries data can also run a motor.

The motor would plug into a standard JST header, and the board could be shaped to mount right on the back of the motor.

## Why

I wanted a camera slider for print timelapses: a stepper that moves the camera a precise amount every layer, driven from a Klipper macro so it stays in sync with the print. Adding a motor to Klipper normally means a free driver on the mainboard, or another control board with its own power supply and wiring. One USB-C cable doing both jobs seemed much simpler.

It started when I moved my Ender 3 V2 to a direct drive toolhead (a Revo Hemera XS) and had the old extruder motor left over. The printer's Creality 4.2.2 board had no free driver for it, and otherwise I had no reason to replace that board.

## USB-C and Power Delivery

A normal USB port only supplies 5 V, which is too little to do much with a stepper. With PD, a device can negotiate 9, 15, or 20 V at up to 5 A (100 W), and PD 3.1 adds 28, 36, and 48 V. The catch is that the source has to speak PD: a USB-C charger or a PD power injector in line with the data, not the plain USB port on a Raspberry Pi.

At the time I was seeing toolhead boards that used USB-C connectors and cables to carry the printer's own power alongside USB data. As far as I could tell that was outside the USB spec, so a cable plugged into the wrong thing could do damage. I wondered whether real PD negotiation could do the same job safely. Most of the community was moving toolheads to CAN bus instead.

A whole toolhead is a bigger ask than one motor: a Revo heater is 40 W and high-flow heaters run 60 W or more, on top of the motors and fans. 100 W of PD might cover it. Taken all the way, you could picture a printer wired entirely with USB-C, one cable from the host to each motor.

## Where things are now

I never built it. Klipper has supported the RP2040 for a while, and it has become a common chip in small Klipper add-ons, like the USB accelerometer boards used for input shaping. The pieces for this board exist; it would mostly be the PD controller and the power stage.

[^1]: A "step-stick" is the common name for small stepper driver boards: a stepper motor controller chip and its supporting parts on a 2×8-pin, 2.54 mm pitch module. The form factor has stayed the same for over a decade, so drivers are easy to swap.

[^2]: USB Power Delivery (PD) is the part of the USB-C standard that lets a device and a charger agree on a higher voltage and current than the default 5 V.
