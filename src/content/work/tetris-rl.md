---
title: Reinforcement Learning applied to Tetris
blurb: An agent that learns to play Tetris — a genuinely fun excuse to get hands-on with reward shaping.
kind: School
year: '2020'
stack: ['Python', 'Reinforcement learning']
order: 8
links:
  - label: Download the code
    href: /files/tetris-ai.zip
  - label: More on GitHub
    href: https://github.com/davidgraymi/tetris-ai
---

A school project with a classmate, and one of the more purely enjoyable things I
have built.

Tetris is a good teaching problem for reinforcement learning because the reward
is so easy to get wrong. Score per line cleared sounds obvious, and produces an
agent that stacks recklessly and dies. The learning is in the shaping: how much
to punish height, how much to punish holes, and how much to leave alone so the
agent can discover something you did not think of.
