---
title: Threat modeling a zero-trust deployment pipeline
blurb: A continuous deployment pipeline for configuration-as-code and infrastructure-as-code into Kubernetes, designed from its threat model outward so the release process does the security review.
kind: Professional
category: security
year: '2025 — present'
stack: ['Threat modeling', 'Kubernetes', 'Helm', 'Azure']
highlight: Security review is a stage of the release, not a meeting before it
featured: true
order: 0
cover: ../../assets/work/zero-trust-delivery.svg
coverAlt: Diagram of a delivery pipeline running from a commit, through verified build and policy stages, into a Kubernetes cluster, with a trust boundary drawn at every hand-off.
links: []
---

A deployment pipeline is the most privileged user in most organizations. It can
change every running system, it works at 3am without supervision, and nobody
reviews its access the way they'd review a person's. If you can push to the
thing that deploys, you own production.

That is the starting point for the pipeline I designed and threat modeled as a
product security engineer at Boeing: continuous deployment of
configuration-as-code and infrastructure-as-code into Kubernetes clusters, with
security review built into the release process rather than scheduled around it.

## The constraint

Two kinds of change go through the same door. Helm charts describe what runs;
infrastructure-as-code describes what it runs on. Both are code, both are
reviewed as code, and both end up with enough privilege to take the platform
down. A pipeline that treats them as low-risk "just config" is a pipeline that
can be talked into anything.

"Zero trust" here means something narrow and checkable: no stage accepts an
input because of where it came from. Every hand-off between stages is a trust
boundary, and every boundary has to answer three questions on its own:

- **Who produced this?** An identity, not a network location.
- **Has it changed since?** Integrity checked at the boundary, not assumed from the previous stage.
- **Is it allowed?** Policy evaluated where the change is applied, not only where it was reviewed.

## Threat model first

I drew the pipeline as a data-flow diagram before writing any of it: sources,
build, artifact storage, the deploy step, the clusters. Then I walked each
boundary asking what an attacker gets for compromising the thing on either side.
That exercise is where most of the design came from. The stages that looked
harmless on a whiteboard were usually the ones holding credentials for the next
stage.

The result is a pipeline whose stages hold the least access that lets them do
their one job, and where the security checks are pipeline stages with pass/fail
results. A reviewer's approval is still required. It just isn't the only thing
standing between a bad change and a cluster.

## What I'd tell someone starting one

Model the pipeline as an attacker's target before you model it as a
developer's tool. The convenience features are where the privilege hides.

*Program details are omitted. Happy to talk through the approach at whatever
level of detail is appropriate.*
