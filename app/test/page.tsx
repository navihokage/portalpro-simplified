export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '32px', color: '#333' }}>Test Page - PortalPro</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>If you can see this, the deployment is working!</p>
      <p style={{ marginTop: '20px' }}>Current time: {new Date().toISOString()}</p>
    </div>
  )
}