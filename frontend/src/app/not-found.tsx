import Link from 'next/link';
import { Sprout, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9f6',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '48px 32px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Sprout size={32} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '3rem',
            fontWeight: 800,
            color: 'var(--primary-900)',
            marginBottom: '8px',
          }}
        >
          404
        </h1>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '12px',
          }}
        >
          Field Not Found
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          The agricultural page or record you are searching for does not exist or has been moved.
        </p>

        <Link href="/ledger" className="btn btn-primary" style={{ display: 'inline-flex', padding: '12px 24px' }}>
          <ArrowLeft size={16} /> Return to Ledger
        </Link>
      </div>
    </div>
  );
}
