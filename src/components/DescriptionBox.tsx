'use client'

import React from "react"

export default function DescriptionBox() {
  return (
    <div
      className="description-box"
      style={{ backgroundImage: "url('/background1.jpg')" }}
    >
      {/* Overlay */}
      <div className="description-box-overlay"></div>

      {/* Content */}
      <div className="description-box-content">
        <h1 className="description-box-title">Welcome to NARANJA</h1>
        <p className="description-box-text">
          Your trusted partner in food manufacturing training.
          Explore our work instructions, instructional media, and get in touch with us.
        </p>
      </div>
    </div>
  )
}
