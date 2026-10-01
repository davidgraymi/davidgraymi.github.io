---
title: "Connecting the Dots: How a Sign Language Capstone Got Me Hooked on AI"
description: "Looking back at my senior capstone project at Missouri State — building a real-time American Sign Language smart home controller with MediaPipe, custom CNNs, and networking — and how it sparked my path in machine learning."
pubDate: 2026-10-01
tags: ['ai', 'machine-learning', 'computer-vision', 'tensorflow', 'mediapipe', 'capstone']
---

During undergrad, machine learning often felt like an academic abstraction. You learn
the calculus of backpropagation, you write loss functions on a whiteboard, and you train
toy MNIST classifiers inside isolated Jupyter notebooks. You know the math works,
but it exists in a vacuum. It feels separate from the messy reality of building software
that actually does something in the physical world.

That changed in my senior year at Missouri State University. For our capstone project,
our team set out to build an end-to-end American Sign Language (ASL) recognition system
capable of controlling off-the-shelf smart home devices in real time.

Putting an entire system together—from raw video capture and custom UDP streaming to
Google MediaPipe C++ extensions, convolutional neural networks, grammar correction,
and IoT socket actuation—really connected the dots for me. It was the project that
turned machine learning from a curious theoretical topic into an enduring obsession.

Our full team paper, [*Simplifying Sign Language Detection for Smart Home Devices using Google MediaPipe*](/files/sign-language-paper.pdf),
is now hosted on this site. Here is the story of what we built, what broke, and what
it taught me about real-world AI engineering.

---

## The problem: smart homes that only listen

Voice assistants like Amazon Alexa and Google Home have become fixtures of everyday
living. But their core interaction model makes an unspoken assumption: *the user can speak.*
For Deaf and hard-of-hearing communities, hands-free smart home technology has
historically remained out of reach.

Our team—Braden Bagby, David Gray, Riley Hughes, Zachary Langford, and Robert Stonner—wanted
to build a functional, accessible alternative. The vision was simple: a user stands in front
of an inexpensive camera, spells a command in American Sign Language, and their smart lights
turn on or off.

```
[ User Signs ] ──► [ Camera Client ] ──► [ UDP Stream ] ──► [ MediaPipe 3D Landmarks ]
                                                                       │
[ Smart Light ] ◄── [ IFTTT API ] ◄── [ Grammar Correction ] ◄── [ Custom CNN Classifier ]
```

The concept was straightforward. The implementation was anything but.

---

## Why raw pixels are the wrong abstraction

When people first approach computer vision for gesture recognition, the intuitive instinct
is to build an end-to-end convolutional neural network that ingests raw camera frames.
Take a $1920 \times 1080$ video frame, downsample it, feed it through a deep ResNet or
VGG-style architecture, and output a prediction.

In practice, that monolithic approach crashes into two brick walls:

1. **Compute constraints:** Smart home devices and edge cameras are powered by low-cost
   embedded processors. They cannot run heavy multi-million parameter vision backbones at 30
   frames per second.
2. **Environmental fragility:** Raw pixel models overfit terribly to background clutter,
   skin tones, shadows, and varying room lighting. A model trained in a sunlit lab fails
   in a dimly lit living room at night.

The breakthrough for our architecture came from decoupling perception from classification.
Instead of forcing our neural network to understand both "where is the hand in this 3D room"
and "what sign does that hand represent," we let Google MediaPipe do the heavy spatial lifting.

MediaPipe Hands tracks 21 normalized 3D skeletal landmarks per hand. Each landmark provides
$(x, y, z)$ coordinates bounded in $[-1, 1]$. In an instant, a massive matrix of $480 \times 640 \times 3$
noisy RGB pixels collapses into a clean vector of **63 floating-point numbers**.

---

## Building the distributed pipeline

To make this work on realistic hardware, we split the application into a distributed
client-server architecture.

### 1. Low-latency UDP video streaming
Edge devices (like a Raspberry Pi with a camera module) capture video frames using OpenCV.
To prevent latency buildup, we designed an application-layer network protocol over UDP.
Each video frame is chopped into 20 slices, prepended with a 40-byte custom header containing
frame sequence numbers, frame byte sizes, slice sequences, and slice sizes, and transmitted
over UDP sockets.

On the server side, an incoming packet collector reassembles the slices onto a priority heap.
We implemented a configurable frame timeout: if a slice drops and the frame isn't reassembled
within $n$ milliseconds, the server skips ahead to the latest frame. This created a direct,
tunable tradeoff between frame rate lag and visual glitching. Once reconstructed, the frames
are encoded to JPEG and passed over TCP into MediaPipe.

### 2. Modifying MediaPipe with custom C++ calculators
MediaPipe's internal architecture is a computational graph of calculator nodes defined in
protocol buffers (`pbtxt`). Because stock MediaPipe is designed to read directly from a local
desktop webcam and render output to a desktop GUI window, we had to get under the hood.

We wrote custom C++ `Calculator` nodes extending MediaPipe's base classes and produced two
custom builds:
- **`MediaPipe Trainer`:** A CLI utility using OpenCV to ingest static image files from our
  training corpora, run palm and landmark detection, and write normalized coordinate arrays
  directly to CSV datasets.
- **`MediaPipe Run`:** A background server daemon that accepts continuous JPEG streams over
  a TCP socket and pipes detected 21-point coordinate arrays over TCP to our inference
  engine in real time.

---

## My part: the gesture classifier

My primary responsibility on the project was designing, training, and optimizing the gesture
classifier.

Since we were operating on MediaPipe's normalized 3D landmarks rather than raw pixels, we
could shape our data into tensors representing individual fingers. The 63 coordinates were
structured so the network could learn the spatial relationships, relative joint angles, and
curvatures of the thumb, index, middle, ring, and pinky fingers.

We implemented a convolutional neural network in TensorFlow consisting of:
- **Three 2D Convolutional layers** equipped with ReLU activation functions to extract
  localized spatial features across finger landmark groups.
- **A Flatten layer** consolidating the extracted feature maps.
- **A Dense fully connected layer** with ReLU activations.
- **A Softmax output layer** generating probability distributions over the target sign classes.

```
Landmark Coordinates (21 points × 3D = 63 floats)
                    │
                    ▼
          [ Finger Tensors ]
                    │
                    ▼
          [ Conv2D + ReLU ] (Layer 1)
                    │
                    ▼
          [ Conv2D + ReLU ] (Layer 2)
                    │
                    ▼
          [ Conv2D + ReLU ] (Layer 3)
                    │
                    ▼
             [ Flatten ]
                    │
                    ▼
          [ Dense + ReLU ]
                    │
                    ▼
         [ Softmax Classifier ]
```

### The 20-class roadblock vs. the 14-class breakthrough

We initially trained the model across 20 distinct sign language characters using a dataset
of roughly 15,000 raw images. But when we evaluated the model against reserved test data,
we hit a humbling result: **62% overall accuracy**.

Plotting the confusion matrix revealed exactly why:
- Static landmark coordinates struggled with letters requiring dynamic motion. For example,
  the letter **J** requires a tracing motion with the pinky; evaluated as a static frame, it
  was repeatedly misclassified as an **I** (44 misclassifications).
- Letters with near-identical frontal finger silhouettes—like **Y** vs. **L** (52 misclassifications),
  **G** vs. **L** (60 misclassifications), and **D** vs. **C** (22 misclassifications)—confused
  the coordinate classifier when relative depth variations were subtle.

This was an invaluable lesson: **the problem wasn't the neural network; it was the feature
representation for dynamic and ambiguous signs.**

To build a reliable smart home controller, precision was non-negotiable—a false positive
triggering the wrong household device is far worse than a missed gesture. We pruned the
problematic letters that demanded temporal motion vectors (G, J, R, S, T, and V) and refined
the vocabulary to 14 rock-solid gestures.

The result on the 14-class model was night and day:
- **Accuracy:** **98.8%**
- **Weighted Precision:** **~99%**
- **Weighted Recall:** **~99%**
- **Weighted F1-score:** **~99%**

Across the entire evaluation dataset, only trace confusion remained in classes C, D, E,
and F, accounting for less than 1% of test samples.

---

## Closing the loop: grammar autosuggest and smart lights

Even a 98.8% accurate classifier will occasionally drop or glitch a character during continuous
signing. To make the interface resilient, we added a grammar correction module downstream.

The grammar module collected character sequences over time windows and ran Levenshtein
edit-distance autosuggestion against a dictionary of valid smart home commands (such as
`"LIGHT ON"`, `"LIGHT OFF"`). If a user signed `"L-I-G-H-T-O-N"`, an errant frame wouldn't
crash the command; the edit-distance filter snapped it to the nearest valid instruction.

Once validated, commands were dispatched over TCP to our client bridge, which called
IFTTT webhooks to toggle the physical lights in our demo.

### Meeting the latency budget

A smart home switch has to feel immediate. If the lag between signing and actuation exceeds
500 milliseconds, users perceive the system as unresponsive and unworkable.

We benchmarked every link in the chain across live video feeds:

- **MediaPipe Landmark Extraction:** 71 ms average
- **Gesture Classification Inference:** 156 ms average
- **Grammar Autosuggest & Network Dispatch:** 1–2 ms
- **Total End-to-End Latency:** **227 ms**

At 227 ms, the entire inference loop executed well beneath our 500 ms target, delivering
smooth, responsive, real-time control.

---

## What connecting the dots taught me

Before this project, I thought machine learning was about models, weights, and loss curves.
After this project, I realized that **machine learning in the real world is almost entirely
systems engineering.**

The neural network was just one component in a much larger machine. It was bounded by
network socket timeouts, constrained by C++ pipeline graphs, dependent on curated
landmark datasets, and rescued by classical edit-distance algorithms. Making it work didn't
require a 100-billion-parameter transformer; it required understanding how data moves
through a complete system and picking the right abstraction at every stage.

That capstone is what got me hooked on AI. It sparked the questions about efficiency,
hardware limits, and runtime overhead that eventually led to my work on tools like
[`neural-cost`](/blog/neural-cost).

If you want to read all the raw data, confusion matrices, and architectural diagrams, you
can [read the full research paper here](/files/sign-language-paper.pdf) or check out the
[project write-up](/work/sign-language-interpreter).
