/** The /about page reads from here. Add a job, it appears. */

export type Role = {
  title: string;
  org: string;
  period: string;
  summary: string;
  points: string[];
};

export const roles: Role[] = [
  {
    title: 'Software Engineer',
    org: 'Boeing',
    period: 'June 2021 — Present',
    summary:
      'Real-time embedded software for weapon systems, plus the DevSecOps tooling my team lives in every day. Starting my career at the bottom of the stack taught me that most of the "magic" in software is just somebody else\'s careful engineering.',
    points: [
      'Engineered a processor from the ground up — kernel, task scheduler, comms protocol — in C and Ada. In production and shipping globally.',
      'Built a portable system library for any RTOS or bare-metal target using C++, Docker, Bazel and GitLab, cutting integration engineering hours by 4×.',
      'Wrote a Go HTTPS server that streamlined integration testing and made the test cycle 10× faster.',
      'Led reverse engineering of a cross-program missile interfacing application, improving real-time telemetry decoding and control (C#, WPF, XAML).',
      'Ran integration tests and data analysis for computer vision work in a simulator and on an experimental aircraft — I got to fly on it.',
      'Supported autonomous vehicle functions by processing GPS and sensor data in Ada and C++.',
      'Hardened an in-house Ada static analysis tool with new security warnings, in C++.',
      'Contributed to proposals that secured multi-million dollar contracts for Boeing weapon product lines.',
    ],
  },
  {
    title: 'Web Developer',
    org: 'Computational Learning Systems Lab',
    period: 'August 2020 — May 2021',
    summary:
      'Kept the lab\'s public face accurate: research pages, paper links, and a consistent format through every semester turnover.',
    points: [
      'Maintained and updated the lab website and its research listings.',
      'Validated links to papers and project artifacts so citations actually resolved.',
    ],
  },
  {
    title: 'Quality Assurance Analyst',
    org: "O'Reilly Auto Parts",
    period: 'June 2020 — August 2020',
    summary:
      'Tested production software and rewrote the SQL underneath the test workflow so results came back fast and correct.',
    points: [
      'Optimized SQL queries inherited from a legacy database.',
      'Reviewed, tested and approved test cases against production software.',
      'Documented bugs in detail in Jira and Confluence.',
    ],
  },
  {
    title: 'Computer Lab Assistant',
    org: 'Missouri State University',
    period: 'September 2019 — May 2021',
    summary:
      'The person students found when something broke. Two years of translating computer problems into plain English.',
    points: [
      'Resolved network, software and hardware issues for students, faculty and lab equipment.',
      'Wrote documentation so the same problem did not need solving twice.',
    ],
  },
  {
    title: 'Research Assistant',
    org: 'Computational Learning Systems Lab',
    period: 'July 2020',
    summary:
      'Data pipelines for algorithm research — preprocessing, running, and reporting results to the professor and grad students.',
    points: [
      'Assisted published work on the effects of t-SNE on traumatic brain injury data.',
      'Built Python preprocessing pipelines with pandas, scikit-learn and matplotlib.',
    ],
  },
];

export type Education = {
  degree: string;
  school: string;
  period: string;
  note?: string;
};

export const education: Education[] = [
  {
    degree: 'M.S. Computer Science — Data Science',
    school: 'University of Illinois Urbana-Champaign',
    period: '2025 — 2027',
    note: 'In progress',
  },
  {
    degree: 'B.S. Computer Science',
    school: 'Missouri State University',
    period: '2017 — 2021',
    note: "GPA 3.52 · Dean's List 2019, 2020, 2021",
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Systems', items: ['C', 'C++', 'Ada', 'Rust', 'Go', 'RTOS & bare metal', 'Linux kernel'] },
  { group: 'AI / ML', items: ['PyTorch', 'TensorFlow', 'Keras', 'NLP & embeddings', 'Computer vision'] },
  { group: 'Product', items: ['Go', 'Vue', 'TypeScript', 'Dart / Flutter', 'AWS', 'SQL'] },
  { group: 'Practice', items: ['Bazel', 'Docker', 'GitLab CI', 'Jenkins', 'DevSecOps', 'Anti-tamper'] },
];

/** Short, checkable facts for the homepage telemetry strip. */
export const stats: { value: string; label: string }[] = [
  { value: '4+ yrs', label: 'Shipping mission-critical software' },
  { value: '98.8%', label: 'Gesture classifier accuracy' },
  { value: '10×', label: 'Faster integration test cycle' },
  { value: '4×', label: 'Fewer engineering hours on porting' },
];

/** What I want to be hired for. Drives the "How I can help" section. */
export const services: { title: string; body: string }[] = [
  {
    title: 'Embedded & real-time',
    body: 'Bare metal, RTOS, kernels, schedulers, drivers, and the boring-but-fatal details of timing, portability and anti-tamper. If it has to be right the first time, this is the work I do daily.',
  },
  {
    title: 'Applied machine learning',
    body: 'Classifiers and NLP pipelines that ship — data preparation through evaluation through deployment. I care more about the failure modes than the leaderboard.',
  },
  {
    title: 'Developer experience',
    body: 'Build systems, CI pipelines, test harnesses and internal tools. Most teams are one good tool away from moving twice as fast, and nobody has time to build it.',
  },
];
