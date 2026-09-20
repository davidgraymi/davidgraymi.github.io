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
    title: 'Product Security Engineer',
    org: 'Cloud Infrastructure',
    period: 'Dec 2025 — Present',
    summary:
      'Lead cloud migration of three software toolchain applications and deliver a live demo that directly contributed to securing the company\'s share of a $90M contract award. Focused on secure cloud adoption, Kubernetes delivery, and building security into the release process itself.',
    points: [
      'Led cloud migration of 3 software toolchain applications and delivered a live demo that directly contributed to securing the company\'s share of a $90M contract award.',
      'Architected and deployed cloud infrastructure using Helm charts and Infrastructure-as-Code practices, standardizing application deployments across Azure.',
      'Configured and operated Istio service mesh for secure inter-service networking within Kubernetes deployments.',
      'Designed and threat modeled a zero-trust continuous deployment pipeline for Configuration-as-Code and Infrastructure-as-Code delivery to Kubernetes clusters, embedding security review into the release process.',
    ],
  },
  {
    title: 'Software Engineer',
    org: 'Boeing',
    period: 'May 2024 — Dec 2025',
    summary:
      'Secured multi-million dollar military contracts for Boeing\'s weapon product lines while building tooling to accelerate integration testing and standardize portable platform infrastructure across RTOS and bare-metal systems.',
    points: [
      'Secured multi-million dollar military contracts for Boeing\'s weapon product lines.',
      'Developed a Go HTTPS server to streamline integration testing, reducing testing time by 10X.',
      'Created a portable system library for any RTOS or bare metal systems using C++, Docker, Bazel and GitLab, reducing engineering hours by 4X.',
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
    title: 'Kubernetes & cloud',
    body: 'Platform engineering, Kubernetes operations, cloud-native systems, and the boring-but-critical details of reliability, automation, and production support. If it has to run at scale without surprise failures, this is the work I do daily.',
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
