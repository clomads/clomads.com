---
type: work
title: Gary Bussy
section: personal
order: 1
status: ongoing
featured: true
description: A platform for testing DIY off-grid automation hardware. Also my house.
hero: IMG_2909.JPG
tags: []
publish: true
redirect_from:
  - featured/gary-bussy
---

## Summary

Gary Bussy is the converted shorty school bus I live and work out of. I purchased her in July of 2020 and it has been an evolving project over the years and has many years of plans to go. I've used it as a platform to learn more about lithium batteries, solar, and DIY home automation with Home Assistant.

I'm working on a whole separate wiki to track and document projects. I will link it here when it's ready. Below is a summary of various aspects of the build.

## Specs

* 1995 Chevy Van G30 Cutaway Chassis
  * 6.5L Detroit Diesel (NA)
  * 4L80E Automatic Transmission
  * 30 Gallon Diesel Tank
  * 10,000lbs GVWR
* 1450 W Solar
  * 4.5Kwh Lithium NMC 7s @ 25.2v Nominal
  * 1kw+ AC Shore Charging + 3500w inverter generator
  * 3000w Inverter
    * Induction Cooktop
    * Kettle
    * Microwave / Air-Fryer
    * Window AC that is probably dying (400w/5000btu)
* Home Assistant OS on N5105 mini PC
  * Surveillance Cameras + Frigate + Google Coral
    * Driver's display
    * Remote Access
    * Security Notifications
  * Solar Generation & Usage Monitoring
  * Lighting, Fans, Appliance, etc Control
    * Most loads are on DC side and switchable

## Services

The following are service I use in my bus for various things and I have provided referral links to help me maintain them.

### Calyx Institute 4G/5G Internet

Calyx Institute is a non-profit doing security research and implementation for public use. A recurring membership fee includes a hotspot device that includes unlimited 4G or 5G data depending on membership level. As of writing I pay $150 quarterly for 4G service I started in 2020, though I could switch to a $400 yearly membership to reduce my monthly cost from $50 to \~$33.  There are higher memberships which give you 5G service and more capable hotspot devices.

My referral link will give you and I both a free month upon your purchase:

[https://members.calyxinstitute.org/r/gznkq\
](https://members.calyxinstitute.org/r/gznkq)

## Future

I have a lot of plans for my bus but it will take time and money to complete. Many projects may be still in development or are simply dreams.

* Push towards 2kw of solar - Far future goal, but existing solar is not enough for about 5 months of the year in Berkeley, CA.
* 10Kwh+ of lithium battery storage with a switch from Li-Ion to LiFePo4
* High power alternator installed but needs proper DC to DC charging system from 12v to 24v
* Finalize paint job with same blue as currently on front-end - accent rub bars and ports with black bed liner.
* Replace hatch cover with tinted polycarbonate and custom opening mechanism (in development)
* Proper freshwater storage and grey water capture system
  * Upgrade from swappable 6 gallon water jerry cans to undermount tank system with hose and gravity fill. \~10-30 gallons dependent on space.
  * Recirculating shower with tankless water heater.
    * Uses a set of filters to purify shower water so it can be recycled over several showers before being discarded and filters cleaned or replaced.
    * Only about 5-10 gallons of water for several showers. Actual count TBD, but existing research says up to 20 showers before replenishing shower water.
    * Leaning towards using propane for tankless water heater, but electric would force me to upgrade aspects of my electrical system (more batteries, solar, generator)
* Every aspect of the bus should be available in Home Assistant, including main drivetrain information and control.
  * Custom ECU for mostly mechanical diesel engine and 4 speed transmission - control should be simple enough to be ran on a modern ESP32
  * Custom dashboard and gauges with CarPlay and Home Assistant access for monitoring during long trips.
  * A current project of mine focuses on the creation of custom expandable switch panels which would be great for commonly used functions allowing less use of a touch screen whilst driving.
  * Existing items still not available in HA
    * Generator start/stop and information tracking
    * DC chest fridge management
    * Tank statuses and warning automations
* Motorized rear access ramp for motorcycles and other large item loading - WIP but haven't touched in years due to selling my motorcycle.
  * Initially I reinforced the wheelchair lift door into a ramp by reinforcing the steel structure and putting the side hinges on the bottom. My bus did not come with the lift. I used a winch and some pulleys to open and close it, but it is a poor solution requiring manual intervention for it to open and close.
  * A future version will swap the original door with a custom aluminum structure wrapped in aluminum diamond plate. A common garage door tension spring with cables will improve the lifting of the ramp, keeping it closed with electronic solenoid latches. It could be fully automated with a heavy duty stepper motor and various sensors.
