import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/dashboard/intro">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

const FeatureList = [
  {
    title: 'Dashboard',
    image: 'https://i.postimg.cc/SN4R6HBX/light-logo.png',
    description: (
      <>
        Learn about the React dashboard. Overview of the UI components, state management using React Query, and how it connects to the backend.
      </>
    ),
    link: '/dashboard/intro',
  },
  {
    title: 'Windows Agent',
    image: 'https://i.postimg.cc/GhRtF6WH/main-logo.png',
    description: (
      <>
        Explore the Python FastAPI service. Learn how it reads logs, exposes endpoints, and auto-syncs its tunnel URL securely.
      </>
    ),
    link: '/agent/intro',
  },
  {
    title: 'NestJS Backend',
    image: 'https://i.postimg.cc/SN4R6HBX/light-logo.png',
    description: (
      <>
        Documentation on the NestJS backend architecture, TypeORM databases (SQLite/PostgreSQL), and Role-Based Access Control.
      </>
    ),
    link: '/backend/intro',
  },
  {
    title: 'Extras & Deployment',
    image: 'https://i.postimg.cc/GhRtF6WH/main-logo.png',
    description: (
      <>
        Guides for local/remote testing, Vercel deployments, Ngrok usage, and setting up Cloudflare Tunnels for permanent URLs.
      </>
    ),
    link: '/extras/testing-deployment',
  },
];

function Feature({image, title, description, link}) {
  return (
    <div className={clsx('col col--3')} style={{marginBottom: '2rem'}}>
      <Link to={link} style={{textDecoration: 'none', color: 'inherit'}}>
        <div className="text--center">
          <img src={image} alt={title} style={{height: '100px', marginBottom: '1rem', borderRadius: '8px'}} />
        </div>
        <div className="text--center padding-horiz--md">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Home | ${siteConfig.title}`}
      description="Documentation for Log Viewer Agent">
      <HomepageHeader />
      <main>
        <section style={{display: 'flex', alignItems: 'center', padding: '2rem 0', width: '100%'}}>
          <div className="container">
            <div className="row" style={{justifyContent: 'center'}}>
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
