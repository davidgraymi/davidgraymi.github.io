---
title: Sign Language Interpretation System
blurb: Control any smart device with American Sign Language — hand tracking, a gesture classifier and grammar correction, wired together over a client-server link.
kind: Capstone
year: '2021'
stack: ['Python', 'TensorFlow', 'MediaPipe', 'C++', 'Computer vision', 'CNN']
highlight: 98.8% accuracy across 14 hand gestures
featured: true
order: 2
links:
  - label: Research paper (PDF)
    href: /files/sign-language-paper.pdf
  - label: Source on GitHub
    href: https://github.com/davidgraymi/Sign-Language-Interpretation-System
---

Smart homes assume you talk to them. My senior capstone team at Missouri State
asked what happens if you sign to them instead. Voice assistants like Alexa and
Google Home are ubiquitous, but they quietly exclude Deaf and hard-of-hearing
users from hands-free smart device control.

Our team—Braden Bagby, David Gray, Riley Hughes, Zachary Langford, and Robert
Stonner—set out to build an accessible alternative: a system that lets a user
control smart home technology by spelling commands in American Sign Language (ASL)
in front of a standard camera, with our demonstration controlling smart lights
via IFTTT.

The full methodology, system architecture, and evaluation benchmarks are
published in our research paper: [*Simplifying Sign Language Detection for Smart
Home Devices using Google MediaPipe*](/files/sign-language-paper.pdf).

## The architectural challenge: separating edge from inference

Most previous work in computer vision sign language detection relied on
monolithic convolutional neural networks running directly on high-dimensional
raw video frames. That approach has two fatal flaws for real-world smart devices:
it demands expensive local compute that low-power edge gadgets lack, and raw-pixel
CNNs are notoriously fragile to changes in background, skin tone, and lighting.

We solved both problems by decoupling the system across two axes:

1. **Client-server separation:** A lightweight edge client handles camera
   capture and actuation, offloading inference to a central server.
2. **Perception vs. classification decoupling:** Instead of classifying raw
   pixels end-to-end, we used Google MediaPipe to reduce complex video frames
   into normalized 3D hand skeletal landmarks, then trained a specialized,
   fast neural network purely on landmark coordinate tensors.

```
[ Camera Client ]
       │
       ▼  Custom UDP Video Stream (packet slicing + zlib)
[ Server UDP Receiver ]
       │
       ▼  JPEG over TCP
[ MediaPipe Run (C++ Custom Calculator) ]  ──► 21 3D hand landmarks (63 floats)
       │
       ▼  TCP Socket
[ Gesture Classifier (TensorFlow CNN) ]    ──► Letter predictions (98.8% acc)
       │
       ▼  IPC
[ Grammar & Autosuggest (Levenshtein) ]    ──► Command resolution
       │
       ▼  TCP Socket
[ Command Dispatcher ] ──────────────────────► Smart Home API (IFTTT)
```

### Video streaming over UDP

To allow inexpensive smart devices to act as input nodes, we built a custom
application-layer network protocol over UDP. OpenCV captures video frames as
NumPy arrays ($480 \times 60 \times 3$). The client divides each frame into 20
slices, prepends a 40-byte custom header (frame sequence, frame size, slice
sequence, slice size), and streams them via UDP.

The server reassembles arriving slices onto a priority heap buffer. A configurable
timeout window balances latency against frame glitching. Reassembled frames are
JPEG-encoded and streamed via TCP into our MediaPipe pipeline.

### Extending MediaPipe with custom C++ calculators

MediaPipe Hands isolates the palm and tracks 21 3D hand landmarks normalized
to $[-1, 1]$ (63 floating-point coordinates). To integrate MediaPipe cleanly into
our distributed pipeline, we wrote custom C++ `Calculator` nodes and compiled
two specialized builds:

- **MediaPipe Trainer:** A command-line utility using OpenCV to read image files
  from our training set, extract hand landmarks, and write structured CSV datasets.
- **MediaPipe Run:** A persistent daemon listening to incoming JPEG streams
  over TCP and streaming extracted 21-point coordinate arrays over TCP to our
  classifier in real time.

## My part: the gesture classifier

I designed, trained, and evaluated the core gesture classification subsystem in
TensorFlow.

Instead of passing heavy image matrices into a vision backbone, we fed our
network the 21 3D coordinates extracted by MediaPipe. We shaped the 63 coordinates
into finger-specific tensors, mapping the natural kinematic structure of the
hand.

The network architecture consists of:
- **Three 2D Convolutional layers** with ReLU activation functions, extracting
  spatial relationships and joint-angle features across fingers.
- **Flatten layer** connecting feature maps into a high-capacity dense representation.
- **Dense fully connected layer** with ReLU activation.
- **Softmax output layer** producing class probabilities.

### Dataset curation & training

We started with a dataset of approximately 15,000 raw ASL images across the
alphabet (A–Z). When running static frames through MediaPipe, single-frame palm
detection can sometimes produce noisy or misaligned landmarks. We cleaned and
curated the dataset, validating the extracted coordinate sets to roughly 300
high-quality landmark examples per gesture.

### Empirical findings: 20 classes vs. 14 classes

In our initial 20-gesture experiment, the classifier reached 62% accuracy
(weighted precision 50%, recall 62%, F1 54%). Analyzing the confusion matrix
revealed clear points of failure: static 3D landmarks struggled with letters
requiring dynamic motion or having near-identical static shapes without depth
context (such as confusing J for I, Y for L, G for L, and D for C).

By pruning gestures that require trajectory tracking or produced high visual
overlap (G, J, R, S, T, V), our 14-class model achieved **98.8% accuracy** with
weighted average precision, recall, and F1-score all at **~99%**, with only
trace confusion across C, D, E, and F (<1% of test samples).

## Grammar correction and IoT execution

Raw gesture output can still suffer from occasional single-frame misfires. We
coupled the classifier with a grammar module that acts as a real-time autocomplete
and autosuggest engine.

Using Levenshtein edit distance against a dictionary of valid smart home command
phrases (e.g., "LIGHT ON", "LIGHT OFF"), the grammar module corrects isolated
character misclassifications before dispatching instructions over a TCP socket
to the command client, which triggers smart light states via IFTTT webhooks.

## Real-time latency budget

For a smart device interface, responsive feedback is critical: latency over
500 milliseconds feels broken, while sub-250 milliseconds feels instantaneous.
Timing benchmarks across live video feeds confirmed:

| Pipeline Stage | Average Latency |
|---|---|
| MediaPipe landmark extraction | 71 ms |
| Gesture neural classifier inference | 156 ms |
| Grammar correction & command routing | 1–2 ms |
| **Total core interpretation latency** | **227 ms** |

At 227 ms end-to-end, the interpretation pipeline sits comfortably inside the
real-time interaction budget.

---

The complete research paper is available as a PDF:
[**Download Research Paper (PDF)**](/files/sign-language-paper.pdf). Source code
and project documentation are hosted on
[GitHub](https://github.com/davidgraymi/Sign-Language-Interpretation-System).
