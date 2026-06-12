'use client';

export default function Footer() {
  return (
    <footer className="glass-panel footer-panel">
      <p style={{ margin: 0, textAlign: 'center' }}>
        © {new Date().getFullYear()} devNawod. All rights reserved.{' '}
        <a 
          href="https://www.nawodmadhuwantha.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}
        >
          nawodmadhuwantha.com
        </a>
      </p>
    </footer>
  );
}
