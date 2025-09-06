"use client";

import Link from "next/link";

export default function ContactPage() {
  return (
    <div>
      <div>
        <form
          className="neon-form"
          onSubmit={(e) => {
            e.preventDefault();
            // handle form submit here
          }}
        >
          <h1>Send us a message</h1>
          <div className="neon-form-grid neon-form-padding">
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" className="neon-input" required />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="neon-input" required />
            </div>
            <div>
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={5} className="neon-input" required />
            </div>
          </div>
          <button
            type="submit"
            className="neon-btn neon-btn-save neon-btn-square"
            data-variant="save"
            aria-label="Send Message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-send neon-icon"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
