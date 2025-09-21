"use client";

import React, { useState } from "react";
import NeonForm from "@/components/NeonForm";
import NeonPanel from "@/components/NeonPanel";
import { FiMail, FiPhone, FiHelpCircle } from "react-icons/fi";

export default function ContactSupport() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1200);
  }

  return (
    <NeonPanel className="max-w-md mx-auto mt-8 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiHelpCircle className="text-neon text-2xl" />
        <h2 className="neon-form-title">Contact Support</h2>
      </div>
      {submitted ? (
        <div className="text-center text-neon font-semibold text-lg py-8">
          Thank you! Your message has been sent.<br />We'll get back to you soon.
        </div>
      ) : (
        <NeonForm title="" onSubmit={handleSubmit} submitLabel={loading ? "Sending..." : "Send Message"}>
          <div className="flex flex-col gap-4">
            <label className="neon-label" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="neon-input"
              value={form.name}
              onChange={handleChange}
              required
            />
            <label className="neon-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="neon-input"
              value={form.email}
              onChange={handleChange}
              required
            />
            <label className="neon-label" htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              className="neon-input"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
            />
          </div>
        </NeonForm>
      )}
      <div className="mt-8 text-base">
        <div className="flex items-center gap-2 mb-2">
          <FiMail className="text-neon" /> <span>support@naranja.com</span>
        </div>
        <div className="flex items-center gap-2">
          <FiPhone className="text-neon" /> <span>+1 (800) 555-0199</span>
        </div>
      </div>
    </NeonPanel>
  );
}
