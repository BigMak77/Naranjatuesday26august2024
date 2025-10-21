"use client";

import React, { useState } from "react";
import { FiMail, FiPhone, FiHelpCircle } from "react-icons/fi";
import SuccessModal from "./SuccessModal";
import NeonIconButton from "./NeonIconButton";

export default function ContactSupport() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);
      setForm({ name: "", email: "", message: "" });
    }, 1200);
  }

  function handleCloseModal() {
    setShowSuccessModal(false);
  }

  return (
    <div className="neon-panel" style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <FiHelpCircle />
        <h2 className="neon-heading" style={{ margin: 0 }}>Contact Support</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="neon-form-group">
          <label htmlFor="name" className="neon-form-label">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            className="neon-input"
          />
        </div>
        
        <div className="neon-form-group">
          <label htmlFor="email" className="neon-form-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="neon-input"
          />
        </div>
        
        <div className="neon-form-group">
          <label htmlFor="message" className="neon-form-label">Message</label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={5}
            className="neon-input"
          />
        </div>
        
        <NeonIconButton
          variant="send"
          title={loading ? "Sending..." : "Send Message"}
          type="submit"
          disabled={loading}
        />
      </form>
      
      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <FiMail /> 
          <span>support@naranja.com</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiPhone /> 
          <span>+1 (800) 555-0199</span>
        </div>
      </div>

      <SuccessModal
        open={showSuccessModal}
        onClose={handleCloseModal}
        title="Message Sent!"
        message="Thank you! Your message has been sent. We'll get back to you soon."
      />
    </div>
  );
}
