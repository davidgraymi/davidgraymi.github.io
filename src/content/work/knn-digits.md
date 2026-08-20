---
title: Handwritten digit recognition with weighted KNN
blurb: A KNN classifier for handwritten digits, plus a k-value optimizer that collapses repeated distance calculations into a single pass.
kind: School
year: '2020'
stack: ['Python', 'KNN', 'Optimization']
highlight: Optimizes k without recomputing distances per candidate
order: 9
links:
  - label: Research report
    href: /files/knn_report.docx
  - label: Download the code
    href: /files/knn.zip
---

Classify a handwritten digit from a 28×28 grid of pixels, each an integer
between 0 and 255. The KNN part is textbook. The part I actually cared about was
the cost of choosing `k`.

The naive approach re-runs the whole distance calculation for every candidate
value of `k`. I wrote an optimizer that reduces this to one instance of the
distance computation per unclassified object, then evaluates every candidate `k`
against those already-computed neighbours.

The full write-up, including the accuracy comparison across `k` values, is in the
research report.
