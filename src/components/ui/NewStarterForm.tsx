"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiUser, FiMail, FiPhone, FiCalendar, FiCheck, FiAlertCircle, FiSearch, FiMapPin } from "react-icons/fi";
import TextIconButton from "./TextIconButtons";
import ContentHeader from "./ContentHeader";
import nationalities from "@/data/nationalities.json";

/**
 * NewStarterForm - A neon-styled form for new employees to fill in their personal details
 * after receiving a job offer. This form is designed to be sent to candidates to collect
 * their information before their start date.
 *
 * The form collects:
 * - Personal Information (name, email, phone)
 * - Employee Details (employee number, start date)
 * - Contact Information
 * - Emergency Contact Details
 * - Additional Information (nationality, notes)
 *
 * All data is stored in the users table.
 */

interface FormData {
  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  // Address Information
  postcode: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  county: string;

  // Employee Details
  start_date: string;

  // Additional Information
  nationality: string;

  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;

  // Medical Questionnaire
  medical_conditions: string;
  allergies: string;
  medications: string;
  disabilities: string;
  gp_name: string;
  gp_address: string;
  gp_phone: string;
  medical_consent: boolean;

  // Optional Notes
  notes: string;
}

interface AddressResult {
  line_1: string;
  line_2: string;
  post_town: string;
  county: string;
  postcode: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewStarterForm() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    postcode: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    county: "",
    start_date: "",
    nationality: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    medical_conditions: "",
    allergies: "",
    medications: "",
    disabilities: "",
    gp_name: "",
    gp_address: "",
    gp_phone: "",
    medical_consent: false,
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Validation function for Step 1
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Address validation
    if (!formData.postcode.trim()) {
      newErrors.postcode = "Postcode is required";
    }
    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = "Address line 1 is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City/Town is required";
    }

    // Start date validation
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }

    // Emergency contact validation
    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = "Emergency contact name is required";
    }
    if (!formData.emergency_contact_phone.trim()) {
      newErrors.emergency_contact_phone = "Emergency contact phone is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = "Please enter a valid phone number";
    }
    if (!formData.emergency_contact_relationship.trim()) {
      newErrors.emergency_contact_relationship = "Relationship is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation function for Step 2 (Medical)
  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    // Medical consent is required
    if (!formData.medical_consent) {
      newErrors.medical_consent = "You must consent to providing medical information";
    }

    // GP details validation
    if (!formData.gp_name.trim()) {
      newErrors.gp_name = "GP name is required";
    }
    if (!formData.gp_address.trim()) {
      newErrors.gp_address = "GP address is required";
    }
    if (!formData.gp_phone.trim()) {
      newErrors.gp_phone = "GP phone is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.gp_phone)) {
      newErrors.gp_phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setErrorMessage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrorMessage("Please fix the errors before proceeding");
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    setCurrentStep(1);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Postcode lookup function using api.postcodes.io (free UK postcode API)
  const lookupPostcode = async () => {
    const postcode = formData.postcode.trim().replace(/\s+/g, "");

    if (!postcode) {
      setErrorMessage("Please enter a postcode");
      return;
    }

    setLoadingAddress(true);
    setAddressResults([]);

    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        // Postcodes.io doesn't provide street addresses, so we'll use a different free API
        // Using ideal-postcodes.co.uk free tier (limited requests)
        const addressResponse = await fetch(
          `https://api.ideal-postcodes.co.uk/v1/postcodes/${postcode}?api_key=ak_test`
        );
        const addressData = await addressResponse.json();

        if (addressData.result && addressData.result.length > 0) {
          const addresses: AddressResult[] = addressData.result.map((addr: any) => ({
            line_1: addr.line_1,
            line_2: addr.line_2 || "",
            post_town: addr.post_town,
            county: addr.county || "",
            postcode: addr.postcode,
          }));
          setAddressResults(addresses);
        } else {
          // If no addresses found, just populate town/county from postcodes.io
          setFormData((prev) => ({
            ...prev,
            city: data.result.admin_district || "",
            county: data.result.region || "",
          }));
          setErrorMessage("Postcode found, but no specific addresses available. Please enter manually.");
        }
      } else {
        setErrorMessage("Postcode not found. Please check and try again.");
      }
    } catch (error) {
      console.error("Error looking up postcode:", error);
      setErrorMessage("Error looking up postcode. Please enter address manually.");
    } finally {
      setLoadingAddress(false);
    }
  };

  // Select an address from results
  const selectAddress = (address: AddressResult) => {
    setFormData((prev) => ({
      ...prev,
      address_line_1: address.line_1,
      address_line_2: address.line_2,
      city: address.post_town,
      county: address.county,
      postcode: address.postcode,
    }));
    setAddressResults([]);

    // Clear address errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.postcode;
      delete newErrors.address_line_1;
      delete newErrors.city;
      return newErrors;
    });
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccess(false);

    if (!validateStep2()) {
      setErrorMessage("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // Check if submission with this email already exists
      const { data: existingSubmissions, error: checkError } = await supabase
        .from("people_personal_information")
        .select("id, email")
        .eq("email", formData.email.toLowerCase());

      if (checkError) {
        throw new Error("Error checking for existing submission");
      }

      if (existingSubmissions && existingSubmissions.length > 0) {
        throw new Error("A submission with this email address already exists. If you need to update your information, please contact HR.");
      }

      // Prepare the data for insertion into people_personal_information table
      const insertData = {
        // Personal Information
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        nationality: formData.nationality.trim() || null,

        // Address Information
        postcode: formData.postcode.trim(),
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim() || null,
        city: formData.city.trim(),
        county: formData.county.trim() || null,

        // Employment Details
        start_date: formData.start_date,

        // Emergency Contact
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        emergency_contact_relationship: formData.emergency_contact_relationship.trim(),

        // Medical Information
        medical_conditions: formData.medical_conditions.trim() || null,
        allergies: formData.allergies.trim() || null,
        medications: formData.medications.trim() || null,
        disabilities: formData.disabilities.trim() || null,

        // GP Details
        gp_name: formData.gp_name.trim(),
        gp_address: formData.gp_address.trim(),
        gp_phone: formData.gp_phone.trim(),

        // Consent
        medical_consent: formData.medical_consent,

        // Additional Notes
        notes: formData.notes.trim() || null,

        // Status
        status: "pending", // Will be reviewed by HR
      };

      // Insert the new starter record into people_personal_information table
      const { error: insertError } = await supabase
        .from("people_personal_information")
        .insert(insertData);

      if (insertError) {
        throw insertError;
      }

      // Success!
      setSuccess(true);
      setCurrentStep(1);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        postcode: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        county: "",
        start_date: "",
        nationality: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        medical_conditions: "",
        allergies: "",
        medications: "",
        disabilities: "",
        gp_name: "",
        gp_address: "",
        gp_phone: "",
        medical_consent: false,
        notes: "",
      });

    } catch (err: any) {
      console.error("Error submitting form:", err);
      setErrorMessage(err.message || "An error occurred while submitting the form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ContentHeader
        title={currentStep === 1 ? "New Starter Information Form - Step 1 of 2" : "Medical Questionnaire - Step 2 of 2"}
        description={currentStep === 1 ? "Welcome! Please fill in your details below. All fields marked with * are required." : "Please provide your medical information. This helps us ensure your safety and wellbeing at work."}
      />

      {/* Step Indicator */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 1.5rem", display: "flex", gap: "1rem", padding: "0 2rem" }}>
        <div style={{ flex: 1, height: "4px", background: "#40e0d0", borderRadius: "2px" }} />
        <div style={{ flex: 1, height: "4px", background: currentStep === 2 ? "#40e0d0" : "rgba(64, 224, 208, 0.3)", borderRadius: "2px" }} />
      </div>

      <form className="neon-form" onSubmit={currentStep === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {currentStep === 1 && (
          <>
        {/* Personal Information Section */}
        <div className="neon-form-section">
          <h2 className="neon-form-section-title">
            <FiUser style={{ marginRight: "0.5rem" }} />
            Personal Information
          </h2>

          <div className="neon-form-row">
            <div className="neon-form-group">
              <label htmlFor="first_name" className="neon-label">
                First Name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className={`neon-input ${errors.first_name ? "error" : ""}`}
                placeholder="Enter your first name"
              />
              {errors.first_name && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.first_name}
                </span>
              )}
            </div>

            <div className="neon-form-group">
              <label htmlFor="last_name" className="neon-label">
                Last Name *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className={`neon-input ${errors.last_name ? "error" : ""}`}
                placeholder="Enter your last name"
              />
              {errors.last_name && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.last_name}
                </span>
              )}
            </div>
          </div>

          <div className="neon-form-row">
            <div className="neon-form-group">
              <label htmlFor="email" className="neon-label">
                <FiMail style={{ marginRight: "0.25rem" }} />
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`neon-input ${errors.email ? "error" : ""}`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.email}
                </span>
              )}
            </div>

            <div className="neon-form-group">
              <label htmlFor="phone" className="neon-label">
                <FiPhone style={{ marginRight: "0.25rem" }} />
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`neon-input ${errors.phone ? "error" : ""}`}
                placeholder="+44 7XXX XXXXXX"
              />
              {errors.phone && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.phone}
                </span>
              )}
            </div>
          </div>

          <div className="neon-form-group">
            <label htmlFor="nationality" className="neon-label">
              Nationality
            </label>
            <select
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="neon-input"
            >
              <option value="">Select nationality</option>
              {nationalities.map((nationality) => (
                <option key={nationality} value={nationality}>
                  {nationality}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address Section */}
        <div className="neon-form-section">
          <h2 className="neon-form-section-title">
            <FiMapPin style={{ marginRight: "0.5rem" }} />
            Address
          </h2>

          <div className="neon-form-row">
            <div className="neon-form-group">
              <label htmlFor="postcode" className="neon-label">
                Postcode *
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="postcode"
                  name="postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={handleChange}
                  className={`neon-input ${errors.postcode ? "error" : ""}`}
                  placeholder="e.g., SW1A 1AA"
                  style={{ flex: 1 }}
                />
                <TextIconButton
                  variant="view"
                  icon={<FiSearch />}
                  label={loadingAddress ? "Looking up..." : "Find Address"}
                  title={loadingAddress ? "Looking up..." : "Find Address"}
                  type="button"
                  onClick={lookupPostcode}
                  disabled={loadingAddress}
                  className="neon-btn-square"
                />
              </div>
              {errors.postcode && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.postcode}
                </span>
              )}
            </div>
          </div>

          {/* Address Results Dropdown */}
          {addressResults.length > 0 && (
            <div className="neon-form-group" style={{ marginBottom: "1rem" }}>
              <label className="neon-label">Select Address</label>
              <select
                className="neon-input"
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  if (!isNaN(index)) {
                    selectAddress(addressResults[index]);
                  }
                }}
                defaultValue=""
              >
                <option value="">-- Choose an address --</option>
                {addressResults.map((address, index) => (
                  <option key={index} value={index}>
                    {address.line_1}, {address.post_town}, {address.postcode}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="neon-form-group">
            <label htmlFor="address_line_1" className="neon-label">
              Address Line 1 *
            </label>
            <input
              id="address_line_1"
              name="address_line_1"
              type="text"
              value={formData.address_line_1}
              onChange={handleChange}
              className={`neon-input ${errors.address_line_1 ? "error" : ""}`}
              placeholder="House number and street name"
            />
            {errors.address_line_1 && (
              <span className="neon-error-text">
                <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                {errors.address_line_1}
              </span>
            )}
          </div>

          <div className="neon-form-group">
            <label htmlFor="address_line_2" className="neon-label">
              Address Line 2
            </label>
            <input
              id="address_line_2"
              name="address_line_2"
              type="text"
              value={formData.address_line_2}
              onChange={handleChange}
              className="neon-input"
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div className="neon-form-row">
            <div className="neon-form-group">
              <label htmlFor="city" className="neon-label">
                City/Town *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className={`neon-input ${errors.city ? "error" : ""}`}
                placeholder="City or town"
              />
              {errors.city && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.city}
                </span>
              )}
            </div>

            <div className="neon-form-group">
              <label htmlFor="county" className="neon-label">
                County
              </label>
              <input
                id="county"
                name="county"
                type="text"
                value={formData.county}
                onChange={handleChange}
                className="neon-input"
                placeholder="County (optional)"
              />
            </div>
          </div>
        </div>

        {/* Employment Details Section */}
        <div className="neon-form-section">
          <h2 className="neon-form-section-title">
            <FiCalendar style={{ marginRight: "0.5rem" }} />
            Employment Details
          </h2>

          <div className="neon-form-group">
            <label htmlFor="start_date" className="neon-label">
              Start Date *
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              className={`neon-input ${errors.start_date ? "error" : ""}`}
            />
            {errors.start_date && (
              <span className="neon-error-text">
                <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                {errors.start_date}
              </span>
            )}
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="neon-form-section">
          <h2 className="neon-form-section-title">
            <FiAlertCircle style={{ marginRight: "0.5rem" }} />
            Emergency Contact
          </h2>

          <div className="neon-form-group">
            <label htmlFor="emergency_contact_name" className="neon-label">
              Contact Name *
            </label>
            <input
              id="emergency_contact_name"
              name="emergency_contact_name"
              type="text"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              className={`neon-input ${errors.emergency_contact_name ? "error" : ""}`}
              placeholder="Full name of emergency contact"
            />
            {errors.emergency_contact_name && (
              <span className="neon-error-text">
                <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                {errors.emergency_contact_name}
              </span>
            )}
          </div>

          <div className="neon-form-row">
            <div className="neon-form-group">
              <label htmlFor="emergency_contact_phone" className="neon-label">
                Contact Phone *
              </label>
              <input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                className={`neon-input ${errors.emergency_contact_phone ? "error" : ""}`}
                placeholder="+44 7XXX XXXXXX"
              />
              {errors.emergency_contact_phone && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.emergency_contact_phone}
                </span>
              )}
            </div>

            <div className="neon-form-group">
              <label htmlFor="emergency_contact_relationship" className="neon-label">
                Relationship *
              </label>
              <select
                id="emergency_contact_relationship"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
                className={`neon-input ${errors.emergency_contact_relationship ? "error" : ""}`}
              >
                <option value="">Select relationship</option>
                <option value="Spouse/Partner">Spouse/Partner</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
              {errors.emergency_contact_relationship && (
                <span className="neon-error-text">
                  <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                  {errors.emergency_contact_relationship}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="neon-form-section">
          <h2 className="neon-form-section-title">
            Additional Information
          </h2>

          <div className="neon-form-group">
            <label htmlFor="notes" className="neon-label">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="neon-input"
              rows={4}
              placeholder="Any additional information you'd like to share..."
            />
            <small className="neon-help-text">
              e.g., dietary requirements, accessibility needs, preferred working hours, etc.
            </small>
          </div>
        </div>

        {/* Error Messages for Step 1 */}
        {errorMessage && (
          <div className="neon-error-banner">
            <FiAlertCircle style={{ marginRight: "0.5rem" }} />
            {errorMessage}
          </div>
        )}

        {/* Step 1 Actions */}
        <div className="neon-form-actions" style={{ marginTop: "2rem" }}>
          <TextIconButton
            variant="save"
            label="Next: Medical Questionnaire"
            type="submit"
            className="neon-btn-square-form"
          />
        </div>
        </>
        )}

        {currentStep === 2 && (
          <>
            {/* Medical Questionnaire Section */}
            <div className="neon-form-section">
              <h2 className="neon-form-section-title">
                <FiUser style={{ marginRight: "0.5rem" }} />
                Medical Conditions
              </h2>

              <div className="neon-form-group">
                <label htmlFor="medical_conditions" className="neon-label">
                  Do you have any medical conditions we should be aware of?
                </label>
                <textarea
                  id="medical_conditions"
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  className="neon-input"
                  rows={3}
                  placeholder="Please describe any medical conditions (or enter 'None')"
                />
                <small className="neon-help-text">
                  This information helps us provide appropriate support and reasonable adjustments
                </small>
              </div>

              <div className="neon-form-group">
                <label htmlFor="allergies" className="neon-label">
                  Do you have any allergies?
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="neon-input"
                  rows={2}
                  placeholder="Please list any allergies (or enter 'None')"
                />
              </div>

              <div className="neon-form-group">
                <label htmlFor="medications" className="neon-label">
                  Are you currently taking any medications?
                </label>
                <textarea
                  id="medications"
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  className="neon-input"
                  rows={2}
                  placeholder="Please list any medications (or enter 'None')"
                />
              </div>

              <div className="neon-form-group">
                <label htmlFor="disabilities" className="neon-label">
                  Do you have any disabilities or require any workplace adjustments?
                </label>
                <textarea
                  id="disabilities"
                  name="disabilities"
                  value={formData.disabilities}
                  onChange={handleChange}
                  className="neon-input"
                  rows={3}
                  placeholder="Please describe any disabilities or adjustments needed (or enter 'None')"
                />
                <small className="neon-help-text">
                  This helps us ensure your workspace and role are accessible
                </small>
              </div>
            </div>

            {/* GP Details Section */}
            <div className="neon-form-section">
              <h2 className="neon-form-section-title">
                <FiPhone style={{ marginRight: "0.5rem" }} />
                GP (General Practitioner) Details
              </h2>

              <div className="neon-form-group">
                <label htmlFor="gp_name" className="neon-label">
                  GP Name *
                </label>
                <input
                  id="gp_name"
                  name="gp_name"
                  type="text"
                  value={formData.gp_name}
                  onChange={handleChange}
                  className={`neon-input ${errors.gp_name ? "error" : ""}`}
                  placeholder="Dr. Smith"
                />
                {errors.gp_name && (
                  <span className="neon-error-text">
                    <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                    {errors.gp_name}
                  </span>
                )}
              </div>

              <div className="neon-form-group">
                <label htmlFor="gp_address" className="neon-label">
                  GP Surgery Address *
                </label>
                <textarea
                  id="gp_address"
                  name="gp_address"
                  value={formData.gp_address}
                  onChange={handleChange}
                  className={`neon-input ${errors.gp_address ? "error" : ""}`}
                  rows={3}
                  placeholder="Surgery name and full address"
                />
                {errors.gp_address && (
                  <span className="neon-error-text">
                    <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                    {errors.gp_address}
                  </span>
                )}
              </div>

              <div className="neon-form-group">
                <label htmlFor="gp_phone" className="neon-label">
                  GP Surgery Phone *
                </label>
                <input
                  id="gp_phone"
                  name="gp_phone"
                  type="tel"
                  value={formData.gp_phone}
                  onChange={handleChange}
                  className={`neon-input ${errors.gp_phone ? "error" : ""}`}
                  placeholder="+44 20 XXXX XXXX"
                />
                {errors.gp_phone && (
                  <span className="neon-error-text">
                    <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                    {errors.gp_phone}
                  </span>
                )}
              </div>
            </div>

            {/* Medical Consent Section */}
            <div className="neon-form-section">
              <h2 className="neon-form-section-title">
                <FiCheck style={{ marginRight: "0.5rem" }} />
                Consent
              </h2>

              <div className="neon-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="medical_consent"
                    checked={formData.medical_consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, medical_consent: e.target.checked }))}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span className="neon-label" style={{ margin: 0 }}>
                    I consent to providing this medical information for occupational health and safety purposes *
                  </span>
                </label>
                {errors.medical_consent && (
                  <span className="neon-error-text">
                    <FiAlertCircle style={{ marginRight: "0.25rem" }} />
                    {errors.medical_consent}
                  </span>
                )}
                <small className="neon-help-text" style={{ marginTop: "0.5rem", display: "block" }}>
                  This information will be stored securely and only accessed by authorized personnel for health and safety purposes
                </small>
              </div>
            </div>

            {/* Error Messages for Step 2 */}
            {errorMessage && (
              <div className="neon-error-banner">
                <FiAlertCircle style={{ marginRight: "0.5rem" }} />
                {errorMessage}
              </div>
            )}

            {/* Step 2 Actions */}
            <div className="neon-form-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
              <TextIconButton
                variant="close"
                label="Back"
                type="button"
                onClick={handlePreviousStep}
                className="neon-btn-square"
              />
              <TextIconButton
                variant="save"
                label={loading ? "Submitting..." : "Submit Information"}
                title={loading ? "Submitting..." : "Submit Information"}
                type="submit"
                className="neon-btn-square-form"
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* Success Message */}
        {success && (
          <div className="neon-success-banner" style={{ marginTop: "2rem" }}>
            <FiCheck style={{ marginRight: "0.5rem" }} />
            Thank you! Your information has been submitted successfully. HR will review and complete your profile setup.
          </div>
        )}

        {/* Footer Note */}
        <p style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.75rem", color: "#40e0d0" }}>
          Your information will be stored securely and used only for employment purposes.
          <br />
          If you have any questions, please contact HR.
        </p>
      </form>
    </>
  );
}
