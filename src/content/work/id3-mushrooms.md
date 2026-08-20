---
title: ID3 mushroom classification
blurb: A from-scratch ID3 decision tree that predicts whether a mushroom is edible or poisonous from its attributes.
kind: School
year: '2020'
stack: ['Python', 'Decision trees', 'Information gain']
order: 10
links:
  - label: Research report
    href: /files/id3_report.docx
  - label: Download the code
    href: /files/id3.zip
---

A colleague and I implemented the ID3 algorithm from scratch, then trained it on
mushroom attributes to classify each specimen as edible or poisonous.

Building a decision tree by hand — computing entropy and information gain at
each split rather than calling a library — is the fastest way I know to
understand why trees overfit, and why the split that looks most informative on
training data is so often the one that betrays you.

Details and results are in the research report.
