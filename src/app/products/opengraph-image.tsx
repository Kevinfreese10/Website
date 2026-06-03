import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Our Professional Services & Solutions | My Accountant';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle decorative outer frame */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            pointerEvents: 'none',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '32px',
            border: '1px solid #cbd5e1',
          }}
        >
          Service Catalog
        </div>

        {/* Heading */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '900',
            color: '#0f172a',
            textAlign: 'center',
            lineHeight: '1.2',
            maxWidth: '900px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <span>Our Professional </span>
          <span
            style={{
              marginLeft: '12px',
              color: '#2563eb',
            }}
          >
            Services &amp; Solutions
          </span>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#64748b',
            textAlign: 'center',
            lineHeight: '1.6',
            maxWidth: '800px',
            marginBottom: '48px',
          }}
        >
          Explore our comprehensive range of accounting, taxation, company registration, and compliance solutions tailored for South African businesses, entrepreneurs, and individuals.
        </div>

        {/* Footer Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#334155',
              letterSpacing: '0.5px',
            }}
          >
            My Accountant
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '18px' }}>|</div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#64748b',
            }}
          >
            www.myacc.co.za
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
