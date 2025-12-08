import Link from 'next/link'

export default function TestPage() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#0f172a',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#60a5fa' }}>
        🎉 Dorce.ai is LIVE!
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', textAlign: 'center', maxWidth: '600px' }}>
        Your deployment is working correctly. This is a test page to verify everything is functioning.
      </p>
      <div style={{ 
        backgroundColor: '#1e293b', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#93c5fd', marginBottom: '10px' }}>Next Steps:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ Frontend deployed successfully</li>
          <li>⏳ Deploy Railway backend</li>
          <li>⏳ Connect frontend to backend</li>
        </ul>
      </div>
      <Link 
        href="/" 
        style={{ 
          color: '#60a5fa', 
          textDecoration: 'none',
          fontSize: '1.1rem',
          border: '1px solid #60a5fa',
          padding: '10px 20px',
          borderRadius: '5px',
          marginTop: '20px'
        }}
      >
        Go to Homepage →
      </Link>
    </div>
  )
}