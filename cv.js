// Single source of truth for the page and the assistant.
// Every item has an id. The assistant cites these ids and the page highlights them.
export const CV = {
  name: 'Suhas Thakral',
  title: 'Head of Business Intelligence, Data and AI Leader',
  location: 'Berlin, Germany',
  links: [
    { label: 'Email', href: 'mailto:suhas.thakral@whu.edu' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/suhas-thakral-6974a479' },
    { label: 'GitHub', href: 'https://github.com/SuhasThakral' },
    { label: 'Medium', href: 'https://medium.com/@suhasthakral' },
  ],
  lead: 'Data leader with 9+ years of experience in Business Intelligence, Analytics and AI.',
  summary: [
    { id: 's1', label: 'Business meets technology', text: 'Studied economics in Delhi and management at WHU, taught himself data and grew from analyst to Head of BI, so he understands how a business makes money and the technology behind its numbers.' },
    { id: 's2', label: 'Leader and storyteller', text: 'Has worked directly with a CEO and CFO, led a team across three countries and coordinated engineering, product and commercial teams, making data tell a clear story to anyone from a sales manager to the board.' },
    { id: 's3', label: 'AI-forward', text: 'Close to the AI wave from its early days, building with new tools as they appear and putting them to work in live BI.' },
  ],
  achievements: [
    { id: 'a1', label: 'Revenue via incentives', text: 'Lifted gross revenue by ~50% by tying compensation to net revenue, leading the model from design through rollout (Atheneum).' },
    { id: 'a2', label: 'Team leadership', text: 'Grew and led a BI team from 1 to 8 across Berlin, London and APAC, owning hiring, standards and mentoring (Atheneum).' },
    { id: 'a3', label: 'AI-enabled self-service', text: 'Led the rollout of LLM-powered insights and AI Text-to-SQL on n8n, so non-technical teams can query Salesforce data in plain language (HYGH).' },
    { id: 'a4', label: 'Data platform', text: 'Led the build of the data platform, KPI definitions and data dictionary from scratch, giving leadership, investors and the board a single source of truth (HYGH).' },
    { id: 'a5', label: 'Revenue attribution', text: 'Led a screen-level revenue attribution model, enabling cleaner, more transparent investor reporting (HYGH).' },
    { id: 'a6', label: 'Reporting automation', text: 'Reduced manual reporting time by 70%+ across multiple departments.' },
  ],
  experience: [
    {
      role: 'Head of Business Intelligence', company: 'HYGH', place: 'Berlin', dates: 'Apr 2022 to present',
      context: 'Digital out-of-home advertising platform',
      bullets: [
        { id: 'h1', text: 'Acted as sparring partner to the CEO and CFO, setting BI strategy and steering priorities across Operations and Commercial teams.' },
        { id: 'h2', text: 'Owned the BI roadmap, prioritising requests across departments, aligning stakeholders on KPIs and rolling out a data dictionary and self-service BI.' },
        { id: 'h3', text: 'Led the build of the data infrastructure, selecting BigQuery (GCP), dbt, Fivetran and Tableau and coordinating delivery with engineering and product teams.' },
        { id: 'h4', text: 'Led AI adoption across BI, introducing prompt engineering frameworks, LLM-powered insights and Text-to-SQL on n8n to replace manual query work.' },
        { id: 'h5', text: 'Steered automated investor-grade dashboards and board-level reporting, and acted as Salesforce product owner.' },
        { id: 'h6', text: 'Drove commercial impact: ~11% revenue potential through CMP negotiation, ~10% OPEX reduction through a proportional rent model, and ~30 minutes saved per sales offer through an automated quoting tool.' },
      ],
    },
    {
      role: 'Business Intelligence Team Lead', company: 'Atheneum', place: 'Berlin', dates: 'Jan 2020 to Apr 2022',
      context: 'Global expert network. Reported to the Head of Global Operations.',
      bullets: [
        { id: 't1', text: 'Built and led a team of 8 across three locations, setting structure and standards and mentoring analysts.' },
        { id: 't2', text: 'Led a master reporting project, coordinating stakeholders to democratise data access company-wide.' },
        { id: 't3', text: 'Directed revenue modelling and forecasting used for target-setting across the global business.' },
        { id: 't4', text: 'Lifted gross revenue by ~50% by leading the design and rollout of a net revenue compensation model.' },
      ],
    },
    {
      role: 'Business Intelligence Controller', company: 'Atheneum', place: 'Berlin', dates: 'Jun 2019 to Jan 2020',
      bullets: [
        { id: 'c1', text: 'Automated controlling tasks using Tableau and Zapier, eliminating recurring manual processes.' },
        { id: 'c2', text: 'Built executive and client-facing dashboards, supporting C-level decisions with trend and seasonality analysis.' },
        { id: 'c3', text: 'Produced SQL-based data extraction and transformation for ad-hoc analysis and investor presentations.' },
      ],
    },
    {
      role: 'CRM Manager', company: 'Smunch', place: 'Berlin', dates: 'Nov 2018 to Jun 2019',
      bullets: [
        { id: 'r1', text: 'Managed CRM migration and data cleaning, and implemented and optimised the end-to-end sales process using Marketing Cloud automations.' },
        { id: 'r2', text: 'Built Tableau and Salesforce reports to track new KPIs, and trained the sales team on the new platform.' },
      ],
    },
    {
      role: 'Business Intelligence Analyst', company: 'Medigo', place: 'Berlin', dates: 'Nov 2017 to Nov 2018',
      bullets: [
        { id: 'm1', text: 'Owned and administered the CRM, improving sales processes through data analysis and conversion rate insights.' },
        { id: 'm2', text: 'Built QlikSense dashboards for operational and financial KPIs, and developed a demand forecasting model.' },
      ],
    },
    {
      role: 'Consultant', company: 'Aon', place: 'Gurugram, India', dates: 'Jun 2014 to Feb 2015',
      bullets: [
        { id: 'n1', text: "Managed team engagement projects across South East Asian and European markets, and developed ROI presentations for global clients including McDonald's." },
      ],
    },
  ],
  projects: [
    { id: 'p1', label: 'Context and semantic engine', text: 'System turning scattered company data into an inspectable memory for AI agents, with fact-level provenance and an AI skill that resolves conflicts between sources (Big Berlin Hack, Qontext track).', href: 'https://github.com/SuhasThakral/hackathon_berlin' },
    { id: 'p2', label: 'BuildingBrain', text: 'Property management AI dashboard merging ERP, Gmail, Slack and scanned PDFs into a live, AI-ready context file per property (Big Berlin Hack, Buena track).', href: 'https://github.com/SuhasThakral/building-brain-dashboard' },
    { id: 'p3', label: 'Writing', text: '16 published Medium articles on LLMs, MCP, local models, dbt and BigQuery.', href: 'https://medium.com/@suhasthakral' },
  ],
  education: [
    { id: 'e1', text: 'Master in Management, WHU – Otto Beisheim School of Management, 2015 to 2017' },
    { id: 'e2', text: 'Exchange program, University of South Carolina, Darla Moore School of Business, 2016' },
    { id: 'e3', text: 'Bachelor of Arts in Economics, Delhi University, Hansraj College, 2011 to 2014' },
  ],
  skills: [
    { id: 'k1', label: 'Visualisation', text: 'Tableau, Looker Studio, QlikSense, Metabase' },
    { id: 'k2', label: 'Data warehousing', text: 'BigQuery, AWS' },
    { id: 'k3', label: 'Programming', text: 'SQL, Python' },
    { id: 'k4', label: 'ETL and transformation', text: 'dbt, Fivetran, Stitch Data, Airflow, Cloud Functions, Cloud Scheduler, ZeroETL' },
    { id: 'k5', label: 'CRM', text: 'Salesforce, HubSpot, Pipedrive' },
    { id: 'k6', label: 'AI and automation', text: 'OpenAI API, Claude, Claude Code, Lovable, Supabase, Vercel, LM Studio, n8n Agents, RAG, MCP, Prompt Engineering' },
    { id: 'k7', label: 'Languages', text: 'English (fluent), German (telc B1)' },
  ],
  recommendations: [
    { id: 'q1', by: 'Ammad Ejaz, senior colleague at Atheneum', text: 'His ability to understand business requirements easily and translate them into technical solutions makes him a great asset.' },
    { id: 'q2', by: 'Anam Husain, direct report at Atheneum', text: 'Excellent mentor, with extensive knowledge regarding data management tools.' },
  ],
};

export function flatten(cv = CV) {
  const out = [];
  const add = (section, x) => out.push({ id: x.id, section, text: (x.label ? `${x.label}: ` : '') + x.text + (x.by ? ` (${x.by})` : '') });
  cv.summary.forEach((x) => add('Summary', x));
  cv.achievements.forEach((x) => add('Key achievements', x));
  cv.experience.forEach((j) => j.bullets.forEach((b) => add(`${j.role}, ${j.company}, ${j.dates}`, b)));
  cv.projects.forEach((x) => add('Side projects', x));
  cv.education.forEach((x) => add('Education', x));
  cv.skills.forEach((x) => add('Skills', x));
  cv.recommendations.forEach((x) => add('LinkedIn recommendations', x));
  return out;
}

// Headline numbers for the impact section. Every value comes from the cited CV line.
export const IMPACT = [
  { id: 'a1', num: 50, before: '~', after: '%', label: 'gross revenue lift', detail: 'from a net revenue compensation model he designed and rolled out', where: 'Atheneum', viz: 'bars', ask: 'How did he lift gross revenue by ~50%?' },
  { id: 'a2', num: 8, before: '1→', after: '', label: 'people in the BI team he built', detail: 'across Berlin, London and APAC, with hiring, standards and mentoring', where: 'Atheneum', viz: 'team', ask: 'How did he build and lead his BI team?' },
  { id: 'a6', num: 70, before: '', after: '%+', label: 'less manual reporting', detail: 'across multiple departments', where: 'Across roles', viz: 'shrink', ask: 'How did he cut manual reporting by 70%+?' },
  { id: 'h6', num: 30, before: '~', after: ' min', label: 'saved per sales offer', detail: 'through an automated quoting tool', where: 'HYGH', viz: 'clock', ask: 'What did he automate for the sales team?' },
  { id: 'h6', num: 10, before: '~', after: '%', label: 'OPEX reduction', detail: 'through a proportional rent model', where: 'HYGH', viz: 'down', ask: 'How did he reduce OPEX by ~10%?' },
  { id: 'h6', num: 11, before: '~', after: '%', label: 'revenue potential', detail: 'through CMP negotiation', where: 'HYGH', viz: 'up', ask: 'How did he raise revenue potential by ~11%?' },
];

// Career path for the timeline, oldest first. Level is for drawing only.
export const PATH = [
  { year: '2011', title: 'Economics', org: 'Delhi University', level: 0, kind: 'study' },
  { year: '2014', title: 'Consultant', org: 'Aon', level: 1, kind: 'work' },
  { year: '2015', title: 'Master in Management', org: 'WHU', level: 1.4, kind: 'study' },
  { year: '2017', title: 'BI Analyst', org: 'Medigo', level: 2, kind: 'work' },
  { year: '2018', title: 'CRM Manager', org: 'Smunch', level: 2.5, kind: 'work' },
  { year: '2019', title: 'BI Controller', org: 'Atheneum', level: 3, kind: 'work' },
  { year: '2020', title: 'BI Team Lead', org: 'Atheneum, team of 8', level: 4, kind: 'work' },
  { year: '2022', title: 'Head of BI', org: 'HYGH', level: 5, kind: 'work' },
];
