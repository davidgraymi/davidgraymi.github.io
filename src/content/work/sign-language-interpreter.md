---
title: Sign Language Interpretation System
blurb: Control any smart device with American Sign Language — hand tracking, a gesture classifier and grammar correction, wired together over a client-server link.
kind: Capstone
year: '2021'
stack: ['Python', 'TensorFlow', 'Computer vision', 'CNN']
highlight: 98.8% accuracy across 14 hand gestures
featured: true
order: 2
links:
  - label: Source on GitHub
    href: https://github.com/davidgraymi/Sign-Language-Interpretation-System
---

Smart homes assume you talk to them. My senior capstone team at Missouri State
asked what happens if you sign to them instead.

We built a system that lets a user control any smart technology — a lightbulb
was our demo — by signing in front of a camera. It has three modules: hand and
landmark tracking, gesture classification, and grammar correction. A
client-server connection ties them together, which was the point: it proves the
software can run on any smart device with a camera rather than one bespoke
device.

## My part: the classifier

I built, trained and tested the gesture classifier — a convolutional neural
network that classifies 14 hand gestures at **98.8% accuracy**.

The accuracy number is the headline, but the interesting work was everything
underneath it: getting a dataset that reflected real hands in real lighting,
deciding what counted as a failure (a wrong light turning on is worse than no
light turning on), and keeping inference fast enough that signing felt like
control rather than like waiting.

Source code, live demonstrations and the papers are all on GitHub.
