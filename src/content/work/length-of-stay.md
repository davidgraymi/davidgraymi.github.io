---
title: Healthcare length-of-stay estimator
blurb: A data mining project predicting how long a patient will stay, from admission-time features.
kind: School
year: '2021'
stack: ['Python', 'scikit-learn', 'Data mining']
order: 11
links:
  - label: Download the code
    href: /files/patient_stay_classifier.zip
---

Built for my data mining class: given the features available at admission,
estimate how long a patient will be in the hospital.

Length of stay is a deceptively hard target. The distribution has a long right
tail, the extreme cases are the ones that matter operationally, and a model
optimised for average error will quietly be worst exactly where the cost is
highest.
