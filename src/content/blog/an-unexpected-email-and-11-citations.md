---
title: "An Unexpected Email, REPRO-SIGN, and 11 Citations on Google Scholar"
description: "Years after our college capstone, an out-of-the-blue email from European AI researchers wanting to reproduce our sign language paper led to a wild discovery: we've been cited 11 times."
pubDate: 2026-10-01
tags: ['ai', 'research', 'machine-learning', 'reproducibility', 'capstone', 'google-scholar']
---

Most undergraduate capstone projects have a predictable lifecycle. You spend months running on caffeine, wrestling with stubborn bugs, putting together a demo, presenting your slides to faculty, and submitting a final paper. Then graduation happens. Everyone scatters to their respective jobs, the code sits quietly in a GitHub repository, and the project becomes a pleasant memory you occasionally bring up over drinks or in an interview.

That was exactly how I viewed our senior capstone at Missouri State. Back in 2021, my teammates—Braden Bagby, Riley Hughes, Zachary Langford, Robert Stonner—and I built an American Sign Language smart home controller powered by Google MediaPipe and custom CNNs, culminating in our paper, [*Simplifying Sign Language Detection for Smart Home Devices using Google MediaPipe*](/files/sign-language-paper.pdf).

I hadn’t actively thought about that project in years.

Then today, an email arrived that completely caught me off guard.

---

## The email out of the blue

In my inbox sat a message from Dr. Mirella De Sisto, an Assistant Professor and Humane AI Coordinator at Tilburg University in the Netherlands:

> **Dear Braden and David,**
>
> I am reaching out to you because some time ago I contacted Braden to ask access to the dataset you used in the paper *Simplifying Sign Language Detection for Smart Home Devices using Google MediaPipe* on behalf of the REPRO-SIGN project.
>
> Could you please let me know whether it would be possible to access and use your data?
>
> Thank you so much in advance.
>
> Kind regards,  
> Mirella
>
> **Dr. Mirella De Sisto**  
> Assistant Professor  
> Humane AI (Sector plan) Coordinator  
> Department of Computational Cognitive Science,  
> School of Humanities and Digital Sciences,  
> Tilburg University

Reading further into the forwarded correspondence, she explained the scope of what they are doing:

> I am writing on behalf of **REPRO-SIGN**, a collaborative research initiative coordinated by Mathias Müller at the University of Zurich and carried out by roughly 30 researchers from institutions including the University of Zurich, Northeastern University, the German Research Center for Artificial Intelligence (DFKI), Gallaudet University, Ghent University, Pompeu Fabra University, Tilburg University, Queen’s University Belfast, King Fahd University of Petroleum and Minerals, and Rylo.
>
> REPRO-SIGN investigates reproducibility in computational sign language processing. The project examines a representative selection of research and attempts to reproduce the main quantitative experiments reported in the selected papers. Our aim is to develop a broader understanding of reproducibility across computational sign language research and to identify ways in which reproducibility can be better supported in future work.
>
> We would like to ask you to share with us the dataset used in the paper *Simplifying Sign Language Detection for Smart Home Devices using Google MediaPipe* to carry out the reproduction experiments and to publish model weights resulting from these experiments.

I had to read that twice.

A consortium of roughly 30 researchers across ten prestigious institutions—the University of Zurich, Gallaudet (the premier university for Deaf and hard-of-hearing education), DFKI, Northeastern, and others—is running a systematic reproducibility study on computational sign language research. And of all the literature in the field, they selected our undergraduate capstone paper as part of their representative sample.

---

## "Wait, people actually read this?"

Receiving an email like that is an immediate jolt of adrenaline. But after the initial surprise settled, curiosity took over. 

If an international research group is asking to reproduce our experiments, what had become of our paper since we published it? 

I opened Google Scholar, typed in *Simplifying Sign Language Detection for Smart Home Devices using Google MediaPipe*, and stared at the search result:

**Cited by 11.**

Eleven citations.

For a career academic or a tenured professor with hundreds of papers, eleven citations might seem like a modest number. But for an undergraduate senior project that we submitted as college seniors, eleven citations is surreal.

Looking through the citations, researchers working on gesture interfaces, regional sign language translation (from American Sign Language to Vietnamese Sign Language), assistive robotics, and edge computer vision had actually discovered our work, cited our findings on MediaPipe hand landmark extraction, and referenced our distributed architecture.

When you're an undergrad sitting in a lab at 2 AM trying to figure out why your UDP packet slicing is dropping frames or why your TensorFlow model is confusing the sign for 'J' with 'I', you assume your audience begins and ends with your capstone grading committee. You never imagine that years later, researchers on other continents will be reading those pages, citing them in peer-reviewed journals, and seeking to independently reproduce your benchmarks.

---

## Why reproducibility matters so much

What struck me most about Dr. De Sisto’s email was the mission of **REPRO-SIGN**. 

Machine learning has had a well-documented reproducibility crisis for years. Papers frequently publish eye-popping accuracy figures on closed datasets, omit subtle preprocessing steps, or keep code and model weights private. In computational sign language processing—where ethical data collection, diverse signers, lighting conditions, and dynamic movements make benchmarking particularly tricky—reproducibility is both critical and difficult.

The fact that the REPRO-SIGN initiative exists to do the rigorous, unglamorous work of verifying whether published results actually hold up across independent teams is fantastic. Science doesn't move forward on hype; it moves forward on verifiable, reproducible evidence.

Hearing that our work was chosen to be part of that effort is deeply gratifying.

---

## Digging up the archives

Now comes the fun (and slightly terrifying) part: digital archaeology.

The email asks for the dataset we collected and used to train our 14-class gesture classifier. Fortunately, our code repository has remained public on [GitHub](https://github.com/davidgraymi/Sign-Language-Interpretation-System), and our paper is permanently archived right here on [this website](/files/sign-language-paper.pdf). 

Braden and I are already in touch and digging through old backups, external SSDs, and college cloud drives to retrieve the raw landmark coordinates and image sets so we can hand them over to Dr. De Sisto and the REPRO-SIGN team.

If there’s one lesson I take away from this surprise Thursday email, it’s this: **take pride in what you build, even when you think nobody is watching.** You never know which college project or late-night experiment might ripple outwards and end up contributing to a global scientific community years down the road.
