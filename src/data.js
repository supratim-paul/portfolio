export const P = {
  name: 'Supratim Paul',
  email: 'supratimpaul2023@gmail.com',
  location: 'Siliguri, India',
  github: 'https://github.com/supratim-paul',
  linkedin: 'https://www.linkedin.com/in/supratim-paul/',
};

export const projects = [
  { title: 'WebGuard', category: 'Security / Full stack', text: 'A website security scanner with JWT authentication, a REST API, URL risk scoring, scan history, rate limiting, and SSRF protection.', stack: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'Docker'], link: P.github, live: 'https://webguard-9qzh.onrender.com/', mark: 'WG', cls: 'green' },
  { title: 'Overhead', category: 'Space / Real-time 3D', text: 'A live satellite tracker using SGP4 orbit propagation, a CesiumJS globe, cached TLE data, and location-based pass predictions.', stack: ['Python', 'FastAPI', 'React', 'CesiumJS', 'SQLite'], link: P.github, live: 'https://overhead-iz7f.onrender.com/', mark: 'OH', cls: 'blue' },
  { title: 'Library Management System', category: 'Database / CLI', text: 'A normalized library database with issuance and return workflows, due-date tracking, overdue fine calculation, and SQL reports.', stack: ['Python', 'SQLite', 'SQL'], link: P.github, live: '', mark: 'LIB', cls: 'orange' },
  { title: 'WeatherWise', category: 'Web / Progressive web app', text: 'An animated weather dashboard with live conditions, a seven-day forecast, city search, UV gauge, map, offline cache, and saved preferences.', stack: ['HTML', 'CSS', 'JavaScript', 'PWA', 'Open-Meteo'], link: P.github, live: 'https://supratim-paul.github.io/weatherwise/', mark: 'WW', cls: 'violet' }
];

export const skills = [
  { title: 'Languages', icon: 'code', items: ['Python', 'Java', 'PHP', 'JavaScript', 'SQL'] },
  { title: 'Backend & APIs', icon: 'server', items: ['Node.js', 'Express', 'FastAPI', 'REST', 'JWT', 'SQLAlchemy'] },
  { title: 'Databases', icon: 'db', items: ['PostgreSQL', 'MySQL', 'SQLite', 'Schema design', 'Indexing'] },
  { title: 'Frontend & Tools', icon: 'globe', items: ['HTML', 'CSS', 'React', 'Tailwind', 'Git', 'Docker', 'GitHub Actions', 'CLI'] }
];

export const orbitSkills = ['Python', 'Java', 'JavaScript', 'SQL', 'Node.js', 'FastAPI', 'PostgreSQL', 'React', 'Docker', 'REST', 'JWT', 'Git', 'MySQL', 'PHP'];

export const journey = [
  {
    when: 'Sep 2025 — May 2026',
    title: 'Contributor',
    org: 'GirlScript Foundation',
    place: 'New Delhi, India',
    points: [
      'Optimized SQL indexes on frequently queried columns, cutting query execution time by up to 60%.',
      'Implemented shared input-validation utilities to reduce runtime errors across core flows.',
      'Added client-side form validation to reduce invalid submissions.'
    ]
  },
  {
    when: 'Expected June 2028',
    title: 'Bachelor of Computer Applications',
    org: 'Siliguri Institute of Technology',
    place: 'Computer Applications',
    points: []
  }
];

export const principles = [
  { t: 'Build with purpose', d: 'Start with the problem, then choose the right tool.' },
  { t: 'Keep it dependable', d: 'Readable code, validation, tests, and sound data design.' },
  { t: 'Always iterate', d: 'Ship, learn from the result, and make it better.' }
];
