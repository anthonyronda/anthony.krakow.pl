---
title: "Digital Sovereignty"
description: "Notes I prepared for a meeting with Open Future"
pubDate: 2026-03-06
tags: ["eu", "regulation"]
---

#### This article is just a seedling. I plan to grow it more later.

When I think about digital sovereignty, I'm imagining a few different scenarios that scare me, and that I would like the EU to adequately protect against.

* A foreign state could compel its tech companies to hand over all customer data (and their customers' customer data, and so on). *Data sovereignty* might protect EU companies and residents from malicious data exploitation that upends our lives or threatens us harm.
* A foreign state could order its tech companies to stop all activity in the EU. *Operational sovereignty* might protect us from too much disruption, save EU companies from not being able to operate, and make sure banks, hospitals, and vital government operations stay functioning.
* Additionally, foreign investors have significant influence over their portfolio companies. There's risk of losing digital sovereignty due to how investors might compel EU companies to move outside of the EU, capitulate to foreign orders against EU law, or influence their infrastructure decisions.

There's probably a few others. You smart folks reading this can leave a comment by highlighting somewhere and clicking the comment icon

## Exposure to data exploitation
* The CLOUD Act (2018) allows US law enforcement to compel US companies to produce data regardless of where it's physically stored — EU datacenter or otherwise. This conflicts directly with GDPR
* FISA Section 702 authorizes NSA surveillance of non-US persons located outside the US, explicitly targeting their data held by US companies; reauthorized through April 2026
* Microsoft France's president admitted to the French Senate in 2025 that the company "could not guarantee" customer data would never be transferred to US authorities
* Austria's Ministry of Economy CISO: "Everybody says it's just a theoretical scenario, but now they see it's not only theoretical. If the US government tells Google to shut down all international sites, I don't think 'but the servers aren't in the US' will really matter."

## GDPR Enforcement action taken by the EU
* Meta fined €1.2 billion (May 2023) for transferring Facebook user data to the US without adequate safeguards
* Uber fined €290 million (August 2024) for transferring EU driver data to the US without valid transfer tools
* LinkedIn fined €310 million (October 2024) for unlawful processing for targeted advertising

## United States executive orders have already produced operational sovereignty concerns
Real service disruptions have already occurred: an ICC prosecutor lost access to Microsoft services after US sanctions. Adobe cut off Venezuelan customers. Microsoft blocked access for Indian energy firm Nayara.

## Mobile Platforms: Device-Level Data Collection
* Research from Prof. Douglas Leith found Android devices transmit telemetry data every 255 seconds even when idle, while iOS transmits telemetry data on average every 85 minutes
* Research from Trinity College Dublin found iOS transmits telemetry data regardless of opt-out settings
* Following Senator Wyden's December 2023 disclosure, it became public that multiple governments have requested and received push notification records from Apple

## Migration Costs & Gaps
* A Gartner survey of 214 Western European CIOs (November 2025): 61% intend to shift workloads to local providers due to geopolitical concerns; 44% have already started restricting hyperscaler usage
* Real-time simultaneous document editing scores: Nextcloud/Collabora 7.7 vs. Google's 9.2 (G2 ratings)

## Structural/Technical Impossibilities
* Apple Push Notification service (APNs) is non-negotiable for iOS — all MDM commands route through Apple's US servers with no workaround
* Apple Business Manager explicitly states data "may be stored at Apple's geographic discretion" — no EU-only option exists
* iOS has no mechanism for third-party background push services; there is architecturally no alternative to APNs

## Consumer Demand
* European-alternatives.eu saw 1,100% traffic growth in 2025, with 2M+ total visitors (1.3M in 2025 alone)
* Companies cite their customers' demands for more data privacy as the reason they'd like to switch
