---
title: Your deployment pipeline is your most privileged user
description: A pipeline can change every system you run, at 3am, with nobody watching. How I threat model one, one trust boundary at a time.
pubDate: 2026-10-26
tags: ['security', 'threat-modeling', 'kubernetes', 'devsecops']
draft: true
---

Ask a team who has admin on production and they'll list people. The pipeline
rarely makes the list. It should be first: it can change every running system,
it works unattended, and its access is almost never reviewed the way a person's
would be. Compromise the thing that deploys, and you don't need anything else.

I've spent the last year designing and threat modeling a continuous deployment
pipeline for configuration-as-code and infrastructure-as-code into Kubernetes.
This is the method I use, written down so I stop explaining it on whiteboards.

## Draw it as data, not as stages

The diagram on the wiki shows stages: source, build, test, deploy. That diagram
is for developers. The threat model needs a data-flow diagram instead: what
moves between components, what credentials each one holds, and where one
component starts trusting another.

The difference matters because attackers don't care about stages. They care
about what each box can reach. A "lint" step that runs with the same service
account as the deploy step isn't a lint step, from an attacker's point of view.
It's a deploy step with a friendlier name.

## Every arrow is a trust boundary

Once the flows are drawn, I treat every arrow as a boundary and ask the same
three questions at each one:

1. **Who produced this?** The receiving side should know, by identity, which
   component or person created the input. "It came from inside our network" is
   a location, not an identity.
2. **Has it changed since?** Integrity should be checked where the input is
   used, not assumed because the previous stage was trustworthy.
3. **Is it allowed here?** Policy belongs at the point where a change is
   applied. A review that happened three stages ago tells you a change was
   approved; it doesn't tell you the change arriving now is that one.

Any boundary where one of those answers is "we assume so" goes on the list.

## Then STRIDE each boundary

With the boundaries marked, STRIDE stops being an abstract checklist and becomes
six concrete questions per arrow:

| Threat | The pipeline version of the question |
| --- | --- |
| Spoofing | Can something pretend to be the source, the builder, or a reviewer? |
| Tampering | Can an artifact or chart change between review and deploy? |
| Repudiation | Could someone ship a change and credibly deny it? |
| Information disclosure | Which stage can read secrets it doesn't need? |
| Denial of service | Can a bad input stall every deployment, including the fix? |
| Elevation of privilege | Can a low-trust stage borrow a high-trust stage's credentials? |

Elevation of privilege is the one that finds real problems. Pipelines grow by
accretion; a convenience step added one year inherits credentials scoped for a
different job the year before.

## Treat configuration as code with consequences

Infrastructure-as-code and Helm charts get waved through because they're "just
config." But a chart decides what runs, with what privileges, next to what
data. An infrastructure change decides what the network allows. Both deserve
the same review, the same integrity checks, and the same policy gates as
application code, and arguably more, because their blast radius is the whole
platform rather than one service.

## Make the review a stage

The goal isn't more meetings. It's moving security review into the pipeline as
stages with pass/fail results, so the checks happen on every change rather than
on the changes someone remembered to flag. People still approve changes. They
just stop being the only control between a bad change and a cluster.

## What's left after the model

A threat model doesn't make a pipeline secure. It makes the gaps visible and
ranked, which is the part teams usually skip. The output I care about is a short
list: each boundary, which of the three questions it can't answer yet, and what
it would take to answer it.

Most of the fixes are unglamorous: split a service account, scope a token,
check a hash at the point of use. That's normally where the risk turns out to
be.
