'use client'

import React from "react"

export default function DescriptionBox() {
  return (
    <div
      className="relative bg-center bg-cover bg-no-repeat rounded-2xl p-8 max-w-3xl mx-auto mt-10 text-white shadow-lg"
      style={{ backgroundImage: "url('/background1.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-2xl"></div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-orange-300">Welcome to NARANJA</h1>
        <p className="text-lg leading-relaxed text-teal-100">
          Your trusted partner in food manufacturing training.
          Explore our work instructions, instructional media, and get in touch with us.
        </p>
      </div>
    </div>
  )
}
