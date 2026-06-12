'use client';

export default function Footer() {
  return (
    <footer className="glass-panel" style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      borderRadius: 0,
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      fontSize: '0.85rem',
      color: 'rgba(255,255,255,0.7)'
    }}>
      <p style={{ margin: 0 }}>
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
