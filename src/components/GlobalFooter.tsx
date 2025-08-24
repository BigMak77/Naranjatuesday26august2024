import Link from 'next/link';
import { FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import styles from './globalfooter.module.css';

export default function GlobalFooter() {
  return (
    <footer className={styles.globalFooter}>
      <div className={styles.inner}>
        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <Link href="/homepage/contact-us" className={styles.link}>
              Contact Us
            </Link>
            <Link href="/homepage/about" className={styles.link}>
              About Us
            </Link>
          </div>
          <div className={styles.addressBlock}>
            <span className={styles.address}>
              123 Orange Street, London, UK &bull; +44 20 1234 5678
            </span>
            <span className={styles.copyright}>
              © {new Date().getFullYear()} Naranja Ltd.
            </span>
          </div>
        </div>
        <div className={styles.socials}>
          <a
            href="https://www.linkedin.com/company/naranja"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className={styles.social}
          >
            <FaLinkedin />
          </a>
          <a
            href="https://x.com/naranjateam"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className={styles.social}
          >
            <FiX />
          </a>
          <a
            href="mailto:support@naranja.co.uk"
            aria-label="Email"
            className={styles.social}
          >
            <FaEnvelope />
          </a>
        </div>
      </div>
    </footer>
  );
}
