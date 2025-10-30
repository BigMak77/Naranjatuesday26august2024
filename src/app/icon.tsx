import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

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
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Turquoise orange circle */}
          <circle cx="16" cy="16" r="14" fill="#40e0d0" />
          {/* Highlight to make it look more 3D */}
          <ellipse cx="13" cy="11" rx="4" ry="3" fill="#5ff5e5" opacity="0.6" />
          {/* Small leaf on top */}
          <path
            d="M16 4 C16 4, 18 2, 19 3 C20 4, 19 6, 18 6 C17 6, 16 5, 16 4 Z"
            fill="#2dd4bf"
          />
          {/* Stem */}
          <rect x="15.5" y="2" width="1" height="3" fill="#14b8a6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
