---
type: work
title: Origami
section: personal
status: shelved
tags: []
publish: true
redirect_from:
  - concepts/origami
  - concepts/origami/keyboard
  - concepts/origami/measurements
  - concepts/origami/power
  - concepts/origami/design-reference
  - concepts/origami/display
---

> [!info]
> This was a very early project that got ahead of me, but I'd love to revisit it one day
>
> `Originally written 12/29/2017`

### History

nbPi was initially conceived around October of 2017. It is in direct response to projects like Pocket C.H.I.P, Pandora Project, PiGirl/PiBoy and others. It hopes to be an infinitely modular portable computing system based around the Raspberry Pi Zero/W with considerations for other Raspberry Pi boards.

Key Goals:

* Single board backplane design to incorporate all major I/O and connectivity to modules.
* Detachable keyboard and gamepad sections
* stuff and things

## Goals

* Single circuit board implementation containing the following
  * Top Section: 'The Brains'
    * FRONT: 3.5" Touchscreen attached via standard GPIO header
    * BACK: Raspberry Pi Zero/W attached via standard GPIO header
    * Extend and label left over GPIO pins for easy access
    * USB Hub connected to RPI0/W via a custom pin header and pogo pins
    * Power delivery and battery charger for 3.7v LiPo batteries -JST Connector for battery -- Micro/USB/C input
    * Audio output header - common pin alignment for off-board audio amps - rotary volume control?
    * Easy access USB ports connected to build in hub circuitry
  * Middle section: 'The Gamer'
    * Gamepad consisting of the following:
    * 4-Way D-Pad
    * Two Analog Joysticks: (PSP1000 part is being considered)
    * A/B/X/Y Button set
    * Start/Select/Home
    * BACK: L/R Shoulder and Trigger
    * Controller - ATMEGA32u4 --> USB
  * Bottom Section: 'The Typist'
    * Full QWERTY Keyboard based on an existing membrane layout
    * Considering v1 to use T-Mobile/HTC G1/Dream keyboard membrane
    * Design shall allow users to re-orient keyboard layout for other membranes and order themselves
    * Controller - ATMEGA32u4 --> USB
* Entire system should be able to be created and used on a single double-sided circuit-board
  * Top/Middle/Bottom sections are scored between their perimeter for modification purposes
    * Connections between boards will be USB only and contain pads for re-connection after board is broken
  * Use any dead space for custom parts that can be punched out - eg. pin-header to pogo pin board for USB hub connection

# Keyboard

### Updates

* Jan 16, 2017
  * Focus has switched from a membrane based keyboard to a micro-sized mechanical keyboard. Both options will continue to be developed and hopefully the possibility of them merging into a single board design is possible. The mechanical keyboard design will likely also spin off into its own project, with updates making their way back into nbPi.
  * Add open-source keyboard project references

### Mechanical Keyboard

A mini mechanical keyboard with 3D printed key-caps

### Membrane Keyboard

A matrix keyboard with contact pad alignment for use with a keyboard membrane, specifically the one from the T-Mobile G1/HTC Dream

### References

These links below are references and resources used to create the keyboard section of the nbPi.

#### RC2014 - 40 Key

[http://rc2014.co.uk/modules/universal-micro-keyboard/](http://rc2014.co.uk/modules/universal-micro-keyboard/) This is a good base keyboard based on a Pro-Mini(32u4) or bare DIP ATMEGA328

**Matrix Keyboard BOM**

* 1 off RC2014 KEYBOARD PCB
* 1 off 8 pin RA header
* 1 off 5 pin RA header
* 40 off Tactile Switch
* 8 off 1N4148

`[ATMEGA328 Version available]`

**USB Keyboard BOM**

* 1 off RC2014 KEYBOARD PCB
* 1 off 24 pin wide socket to Pro Mini adapter
* 1 off Arduino Pro Mini
* 1 off 10k Resistor
* 1 off 100nf capacitor
* 41 off Tactile Switch
* 8 off 1N4148

#### w4ilun's Pocket Keyboard 14x5 + 5 (70+5)

This is a really good 14x5 matrix with a 4-way directional stick with center click. It's based on a 32u4 and takes cues from the D60 project below.

**BOM**

Components

* Component/Label/Quantity
* Atmega32u4/\~/1
* Micro USB Connector/\~/1
* 22OΩ/R1, R2/2
* 10KΩ/R3/1
* 330Ω/R4/1
* 22pF/C1, C2/2
* 1uF/C3/1
* LED/D0/1
* 1N4148/D1-D70/70
* TL3303 Tactile Switch/SW/70
* 5-way Switch/S1/1

#### GH60 Project by komar007

[http://blog.komar.be/projects/gh60-programmable-keyboard/](http://blog.komar.be/projects/gh60-programmable-keyboard/)

# Measurements

For now we will base the size arbitrarily off of a board dimension that is in-hand. This will likely change, but will be the starting point.

Current dimensions of main board: 115mm x 160mm

\[TODO] Keyboard Space Requirements: Gamepad Space Requirements: Top Section Space Requirements:

# Power

It will be necessary to include power management and battery charging circuitry on the top section of the board.

It would be optimal to have the device powered by USB-C, but Micro-USB will be acceptable. Possibility to choose between the two? User can solder on either?

### Resources

* USB-C Power delivery circuit
  * Can choose between all available USB-C spec power modes
  * [https://github.com/ReclaimerLabs/USB-PD-Breakout](https://github.com/ReclaimerLabs/USB-PD-Breakout)
  * [https://www.tindie.com/products/ReclaimerLabs/usb-type-c-power-delivery-phy-breakout-board/?pt=ac\_prod\_search](https://www.tindie.com/products/ReclaimerLabs/usb-type-c-power-delivery-phy-breakout-board/?pt=ac\_prod\_search)
  * [https://www.reclaimerlabs.com/](https://www.reclaimerlabs.com/)
  * [https://hackaday.io/project/13476-usb-type-c-power-delivery-breakout](https://hackaday.io/project/13476-usb-type-c-power-delivery-breakout)
* RANDO
  * [https://www.tindie.com/products/ceech/lipo-charger--boost-converter-5v-33v-outputs/?pt=ac\_prod\_search](https://www.tindie.com/products/ceech/lipo-charger--boost-converter-5v-33v-outputs/?pt=ac\_prod\_search)
  * [https://www.tindie.com/products/blkbox/3pcs-micro-usb-5v1a-lithium-batter-charger-module-/?pt=ac\_prod\_search](https://www.tindie.com/products/blkbox/3pcs-micro-usb-5v1a-lithium-batter-charger-module-/?pt=ac\_prod\_search)
  * [https://www.tindie.com/products/BlueSparkLabs/voltage-charge-monitor-for-1s-lipo-batteries/?pt=ac\_prod\_search](https://www.tindie.com/products/BlueSparkLabs/voltage-charge-monitor-for-1s-lipo-batteries/?pt=ac\_prod\_search)
  * [https://www.tindie.com/products/bobricius/usb-liion--lipoly-battery-charger-module/?pt=ac\_prod\_search](https://www.tindie.com/products/bobricius/usb-liion--lipoly-battery-charger-module/?pt=ac\_prod\_search)
  * [https://www.tindie.com/products/openbrite/briteblox-battery-powah-board/?pt=ac\_prod\_search](https://www.tindie.com/products/openbrite/briteblox-battery-powah-board/?pt=ac\_prod\_search)
  * [https://www.tindie.com/products/Cytron/lipo-power-shield/?pt=ac\_prod\_search](https://www.tindie.com/products/Cytron/lipo-power-shield/?pt=ac\_prod\_search)

# Design Reference

### Input Sibling Boards

Design references for researching our 32u4-based input boards. Blogs, schematics, datasheets and CAD files

* Julian Hartline's "Designing and Building an Arduino-Compatible PCB" - Accessed Jan. 13, 2018 [Link](http://blog.julianhartline.com/archives/64)
* Adafruit Itsy 32u4 Board Schematic - Accessed Jan 13, 2018 [Link](https://learn.adafruit.com/assets/49818)
* Adafruit ATMega32u4 Breakout Board Tutorial Download Page (includes Eagle PCB files) - Accessed Jan. 13, 2018 [Link](https://learn.adafruit.com/atmega32u4-breakout/design)
* NumberOne's 32u4 uBBB schematic on Hackaday (micro/ultra Bare Bones Board) - Accessed Jan. 13, 2018 [Link](https://cdn.hackaday.io/images/7383101437163354862.png)
* Microchip's complete datasheet for ATMega32u4 - Accessed Jan. 13, 2018 [Link](http://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7766-8-bit-AVR-ATmega16U4-32U4\_Datasheet.pdf)
* Example of layout and capacitor use for ATMega8u2 on AVRFreaks [Link](http://www.avrfreaks.net/forum/capacitors-32u4)
* Discussion on decoupling capacitors on Vcc pins of ATMega32u4 [Link](http://www.avrfreaks.net/forum/which-decoupling-caps-atmega32u4)

# Display

Our current display is a Waveshare clone display that connects over GPIO to the Raspberry Pi.

Found here: [https://smile.amazon.com/gp/product/B01IGBDT02/](https://smile.amazon.com/gp/product/B01IGBDT02/) We will need to find a wholesale source for these if we want to include them in any kits or fully assembled product

The display and the Pi should sandwich the mainboard of the nbPi with the display on the front and the Raspberry Pi Zero or other on the back. This will allow GPIO to physically pass through the nbPi creating mechanical and electrical connection to all GPIO pins of the Pi and Display. We should consider the heights of the respective header connections to reduce thickness and avoid lever stress on the GPIO headers. It is ok for the display to be soldered to the mainboard but the Raspberry Pi should be able to be removed from its seating in a header. Low profile socket headers are reccomended for the Pi and replacing the display with pin headers so it can be as close to the mainboard as possible is advised.

Layers theorized:

* Display
* solder
* display board
* pin header
* through nbPi mainboard
* solder
* exposed pins
* \=========
* socket header
* raspi
* solder
