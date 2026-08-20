---
title: Patient Care Portal Triage
blurb: An NLP pipeline that routes patient portal messages to the right team and surfaces relevant evidence-based research while they wait for a human.
kind: Research
year: '2025'
stack: ['PyTorch', 'EmbeddingGemma', 'NLP', 'Information retrieval']
highlight: Classifies sentence embeddings into care teams, then retrieves supporting research
featured: true
order: 4
links:
  - label: Source on GitHub
    href: https://github.com/davidgraymi/health-query-classifier
  - label: EmbeddingGemma 300M
    href: https://ai.google.dev/gemma/docs/embeddinggemma
---

Patient portals have a quiet failure mode: a question lands in a generic inbox,
waits, and gets forwarded twice before it reaches someone who can answer it. The
patient learns nothing in the meantime.

This project attacks both halves of that. A classifier triages incoming queries
to the correct team — insurance, scheduling, medical advice, and so on — and an
information retrieval step surfaces relevant evidence-based research so the
patient has something credible to read while they wait for a professional.

## How it works

I built the classifier in PyTorch on top of sentence embeddings from Google's
EmbeddingGemma 300M model. Working on embeddings rather than raw text means the
classifier stays small, trains fast, and generalises across the enormous
variety of ways people describe the same problem.

## What I'd want before it touched a real patient

The honest answer is: a lot. Confidence thresholds with a human fallback,
explicit handling for anything that reads as an emergency, and retrieval that
can only cite a vetted corpus. Healthcare is exactly the domain where the
interesting question is not "how accurate is it" but "what does it do when it
is wrong."
