---
title: Moving three toolchain apps to Kubernetes on Azure
blurb: Three toolchain applications moved to Kubernetes on Azure, deployed one way with Helm and infrastructure-as-code, and secured with an Istio service mesh.
kind: Professional
category: security
year: '2025 — present'
stack: ['Kubernetes', 'Azure', 'Istio', 'Helm', 'Infrastructure-as-code']
highlight: Live demo that helped secure the company's share of a $90M award
order: 0.5
cover: ../../assets/work/cloud-migration.svg
coverAlt: Diagram of three applications moving into a Kubernetes cluster on Azure, each running beside a service-mesh sidecar, with encrypted links between them.
links: []
---

Three software toolchain applications, each deployed its own way, needed to move
to the cloud. Moving them was only half the job. Afterwards they had to be
deployed the same way, talk to each other securely, and stand up in front of a
customer in a live demo that fed into a $90M contract award.

## One way to deploy

The first decision was that none of the three would keep its own deployment
story. Every application ships as a Helm chart (configuration-as-code), and the
Azure resources underneath are infrastructure-as-code. The win from that is
dull and large: a fourth application is a chart and a pull request, not a
project.

It also turned the migration into a reviewable change. When the whole
deployment is text in a repository, a security review is a code review, and
"what changed between Tuesday and Wednesday" has an exact answer.

## A mesh, for identity

Inside the cluster, the applications talk through an Istio service mesh that I
configured and operate. The mesh is there for one main reason: service-to-service
traffic is mutually authenticated and encrypted without any of the three
applications having to implement it. A service's identity comes from the
platform, so policy can say which service may call which, and the network
location of a pod stops being a credential.

The cost is real. A mesh is another control plane to upgrade, another set of
proxies to debug, and a new way for a misconfiguration to break everything at
once. For three applications that previously trusted the network, I think it was
the right trade, but it is a trade.

## The demo

Live demos are their own kind of production. The migrated applications were
shown working in the cloud as part of the pursuit, and that demo directly
contributed to securing the company's share of a $90M award. It is the only
deployment I've done where the audience was the acceptance test.

*Program details are omitted. The engineering is the interesting part anyway.*
