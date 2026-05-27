import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A', // BLACK background to make colors pop
          borderRadius: '6px', // Slight rounding
          fontFamily: 'serif',
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.05em'
        }}
      >
        <span style={{ color: '#ffffff' }}>A</span>
        <span style={{ color: '#D4541A' }}>Y</span>
      </div>
    ),
    { ...size }
  )
}
