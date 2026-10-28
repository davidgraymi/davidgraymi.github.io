/**
 * The resume, in one place. /about and /resume both read from here, and the
 * PDF in public/files/ is printed from /resume (npm run resume:pdf).
 * Add a job, it appears everywhere.
 */

export type Role = {
  title: string;
  org: string;
  location: string;
  period: string;
  summary: string;
  points: string[];
};

export const roles: Role[] = [
  {
    title: 'Product Security Engineer',
    org: 'Boeing',
    location: 'St. Louis, MO',
    period: 'Nov 2025 — Present',
    summary:
      'Secure cloud adoption for software toolchain applications: Kubernetes delivery on Azure, service-mesh networking, and security review built into the release process itself.',
    points: [
      "Led the cloud migration of 3 software toolchain applications and delivered a live demo that directly contributed to securing the company's share of a $90M contract award.",
      'Architected and deployed cloud infrastructure with Helm charts (configuration-as-code) and infrastructure-as-code, standardizing application deployments across Azure.',
      'Configured and operated an Istio service mesh for mutually authenticated service-to-service traffic inside Kubernetes.',
      'Designed and threat modeled a zero-trust continuous deployment pipeline for configuration-as-code and infrastructure-as-code delivery to Kubernetes clusters, with security review built into the release process.',
    ],
  },
  {
    title: 'Software Engineer',
    org: 'Boeing',
    location: 'St. Louis, MO',
    period: 'Jun 2021 — Nov 2025',
    summary:
      'Real-time and embedded software for weapon product lines, from the kernel up, plus the tooling that made integration and porting faster.',
    points: [
      'Engineered a processor software stack from the ground up (kernel, task scheduler, communication protocols) in C and Ada for a globally distributed weapon system.',
      'Built a Go HTTPS server for integration testing that cut testing time by 10×.',
      'Created a portable system library for any OS or bare-metal target with C++, Docker, Bazel and GitLab CI, cutting porting work by 4×.',
      'Applied cryptography and anti-tamper design to RTOS software, and Linux depth to cloud build pipelines.',
      'Led the engineering effort on a cross-program missile interface application, improving real-time telemetry decoding and control (C#, WPF, XAML).',
      'Designed, ran and analyzed requirements-based tests for a formal qualification test event, using a six-degrees-of-freedom simulation and an experimental aircraft.',
      'Worked on the engineering behind multi-million dollar military contract wins for the weapon product lines.',
    ],
  },
  {
    title: 'Web Developer',
    org: 'Computational Learning Systems Lab, Missouri State',
    location: 'Springfield, MO',
    period: 'Aug 2020 — May 2021',
    summary:
      "Kept the lab's public face accurate: research pages, paper links, and a consistent format through every semester turnover.",
    points: [
      'Maintained and updated the lab website and its research listings.',
      'Validated links to papers and project artifacts so citations actually resolved.',
    ],
  },
  {
    title: 'Undergraduate Researcher',
    org: 'Computational Learning Systems Lab, Missouri State',
    location: 'Springfield, MO',
    period: 'Jul 2020 — Aug 2020',
    summary:
      'Data and machine learning pipelines for MRI scans of traumatic brain injuries, feeding published research.',
    points: [
      'Built Python preprocessing and ML pipelines (pandas, scikit-learn, matplotlib) for neuroimaging data.',
      'Implemented dimensionality reduction, including t-SNE, and the analysis workflows around it.',
      'Produced figures and reports with the graduate researchers for the published paper.',
    ],
  },
  {
    title: 'Quality Assurance Intern',
    org: "O'Reilly Auto Parts",
    location: 'Springfield, MO',
    period: 'Jun 2020 — Aug 2020',
    summary:
      'Integration testing against production telemetry, and the SQL underneath it rewritten so results came back fast and correct.',
    points: [
      'Ran integration tests by querying cloud telemetry databases with SQL, and sped up the queries inherited from a legacy database.',
      'Reviewed, tested and approved test cases against production software; documented bugs in Jira and Confluence.',
    ],
  },
  {
    title: 'Co-founder & Full Stack Engineer',
    org: 'Gurulla',
    location: 'Springfield, MO',
    period: 'Jan 2020 — Dec 2020',
    summary: 'A startup year: iOS and Android SaaS apps, built and shipped by a very small team.',
    points: [
      'Built Flutter apps for iOS and Android on a Firebase backend for data and real-time messaging.',
      'Owned the architecture end to end, from the data model to the screens.',
    ],
  },
  {
    title: 'Computer Lab Assistant',
    org: 'Missouri State University',
    location: 'Springfield, MO',
    period: 'Sep 2019 — May 2021',
    summary:
      'The person students found when something broke. Two years of translating computer problems into plain English.',
    points: [
      'Resolved network, software and hardware issues for students, faculty and lab equipment.',
      'Wrote documentation so the same problem did not need solving twice.',
    ],
  },
];

export type Education = {
  degree: string;
  school: string;
  location: string;
  period: string;
  note?: string;
};

export const education: Education[] = [
  {
    degree: 'M.S. Computer Science — Data Science',
    school: 'University of Illinois Urbana-Champaign',
    location: 'Champaign, IL',
    period: '2025 — May 2027',
    note: 'In progress',
  },
  {
    degree: 'B.S. Computer Science',
    school: 'Missouri State University',
    location: 'Springfield, MO',
    period: '2017 — May 2021',
    note: "GPA 3.56 · Dean's List 2019, 2020, 2021",
  },
];

export type Publication = {
  title: string;
  venue: string;
  year: string;
  authors: string;
  href?: string;
};

export const publications: Publication[] = [
  {
    title: 'Simplifying Sign Language Detection for Smart Home Devices using Google MediaPipe',
    venue: 'Missouri State University',
    year: '2021',
    authors: 'B. Bagby, D. Gray, R. Hughes, Z. Langford, R. Stonner',
    href: '/files/sign-language-paper.pdf',
  },
  {
    title: 'Effects of t-SNE Dimensionality Reduction on Traumatic Brain Injury MRI Data',
    venue: 'Computational Learning Systems Lab',
    year: '2020',
    authors: 'D. Gray et al.',
  },
];

export const leadership: { title: string; org: string; period: string; summary: string }[] = [
  {
    title: 'Vice President',
    org: 'Enactus, Missouri State',
    period: 'Sep 2019 — May 2021',
    summary: 'Ran information between the executive board and members, and advised on decisions affecting the chapter.',
  },
];

export const skills: { group: string; items: string[] }[] = [
  {
    group: 'Security & cloud',
    items: ['Threat modeling', 'Zero-trust delivery', 'Kubernetes', 'Istio', 'Helm', 'Azure', 'AWS'],
  },
  {
    group: 'Systems',
    items: ['C', 'C++', 'Ada', 'Rust', 'Go', 'RTOS & bare metal', 'Linux', 'Cryptography & anti-tamper'],
  },
  {
    group: 'AI / ML',
    items: ['PyTorch', 'TensorFlow', 'Keras', 'Transformers', 'scikit-learn', 'pandas', 'Computer vision', 'Reinforcement learning'],
  },
  { group: 'Product', items: ['Python', 'TypeScript', 'Vue', 'C#', 'Dart / Flutter', 'Django', 'SQL'] },
  { group: 'Practice', items: ['Bazel', 'Docker', 'GitLab CI', 'Jenkins', 'Git', 'Bash'] },
];

/** Short, checkable facts for the homepage telemetry strip. */
export const stats: { value: string; label: string }[] = [
  { value: '5+ yrs', label: 'Shipping mission-critical software' },
  { value: '$90M', label: 'Contract award my cloud migration demo helped secure' },
  { value: '10×', label: 'Faster integration test cycle' },
  { value: '4×', label: 'Fewer engineering hours on porting' },
];


/** What I want to be hired for. Drives the "How I can help" section. */
export const services: { title: string; body: string }[] = [
  {
    title: 'Applied machine learning',
    body: 'Classifiers, NLP and computer vision, built end to end in my master\'s and my own projects, from data preparation through evaluation, plus the performance work to know what they cost to run across PyTorch, JAX and TensorFlow. I care more about the failure modes than the leaderboard.',
  },
  {
    title: 'Product & cloud security',
    body: 'Threat modeling, zero-trust delivery pipelines, service-mesh networking, and security review built into the release process instead of bolted on at the end. This is my day job.',
  },
  {
    title: 'Kubernetes & cloud',
    body: 'Platform engineering, Kubernetes operations, cloud-native systems, and the boring-but-critical details of reliability, automation, and production support. If it has to run at scale without surprise failures, this is the work I do daily.',
  },
  {
    title: 'Developer experience',
    body: 'Build systems, CI pipelines, test harnesses and internal tools. Most teams are one good tool away from moving twice as fast, and nobody has time to build it.',
  },
];

/** The rest of it. Drives the "Off the clock" section on the homepage. */
export const offTheClock: { label: string; title: string; body: string; href?: string; cta?: string }[] = [
  {
    label: 'Underwater',
    title: 'Scuba diving',
    body: 'Checklists, gas planning, and a buddy who checks your work. Turns out I like that underwater too.',
    href: '/photos',
    cta: 'Photos',
  },
  {
    label: 'On the wall',
    title: 'Climbing and hiking',
    body: 'Problems you solve with your hands, where the feedback loop is very short and very honest.',
    href: '/photos',
    cta: 'Photos',
  },
  {
    label: 'Player two',
    title: 'Video games',
    body: 'Research, I tell myself. One of them ended up as a reinforcement learning project.',
    href: '/work/tetris-rl',
    cta: 'Tetris RL',
  },
  {
    label: 'Sketchbook',
    title: 'Making art',
    body: 'Things that aren’t software, with nothing to compile and no tests to pass.',
  },
];
