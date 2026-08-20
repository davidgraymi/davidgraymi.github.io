---
title: A processor built from the ground up
blurb: Kernel, task scheduler and communication protocol written from nothing, in C and Ada, now in production and distributed globally.
kind: Professional
year: '2021 — present'
stack: ['C', 'Ada', 'RTOS', 'Bare metal']
highlight: In production. Globally distributed.
featured: true
order: 1
links: []
---

Most engineers meet the operating system as a given. I started my career on the
other side of it.

At Boeing I engineered a processor from the ground up — the kernel, the task
scheduler, the inter-processor communication protocol, the lot — in C and Ada
for a real-time embedded target. It is now in production and shipping globally.

## Why it was hard

Real-time embedded work has no forgiving path. There is no garbage collector to
hide an allocation mistake, no orchestrator to restart a crashed process, and no
opportunity to push a hotfix once the hardware leaves the building. Every timing
assumption has to hold on the worst-case path, not the average one, and every
byte of state has to be accounted for.

The scheduler was the part I think about most. Getting deterministic behaviour
out of a system with competing periodic and aperiodic tasks is less about clever
algorithms and more about being ruthless with the requirements: what genuinely
must happen inside the deadline, and what only feels urgent.

## What I took from it

Starting at the bottom of the stack permanently changed how I read higher-level
code. The "magic" I used to assume was part of every great framework turned out
to be somebody else's careful engineering, made of the same primitives I was
writing by hand. That has made me a much less superstitious debugger.

*Program details are omitted for obvious reasons. Happy to talk about the
engineering at whatever level of abstraction is appropriate.*
