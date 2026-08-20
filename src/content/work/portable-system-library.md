---
title: A system library that runs anywhere
blurb: One portable C++ library targeting any RTOS or bare-metal system, packaged with Docker, Bazel and GitLab CI — cutting porting work by 4×.
kind: Professional
year: '2023'
stack: ['C++', 'Bazel', 'Docker', 'GitLab CI']
highlight: 4× fewer engineering hours spent on porting
order: 3
links: []
---

Every new target meant another round of the same work: re-implement the same
primitives, re-validate the same behaviour, re-learn the same platform quirks.
It was the sort of tax that nobody budgets for and everyone pays.

So I built the abstraction that should have existed — a portable system library
that presents one interface across any RTOS or bare-metal target, with the
platform-specific parts isolated where they belong. Bazel and Docker made the
builds hermetic and reproducible; GitLab CI made "does it still work on all
targets?" a question the machine answers instead of a person.

The measurable result was a 4× reduction in engineering hours on porting. The
unmeasurable one was better: engineers stopped dreading new hardware.

## The DevSecOps half

The same instinct produced a Go HTTPS server that replaced a slow manual
integration testing process and cut the cycle time by 10×, and a set of
optimised Jenkins and GitLab pipelines. Most teams are one good internal tool
away from moving twice as fast, and nobody ever has time to build it. I like
being the person who makes the time.
