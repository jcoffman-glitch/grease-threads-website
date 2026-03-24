"use client";

import { useState, type FormEvent } from "react";
import type { Metadata } from "next";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      serviceType: formData.get("serviceType"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please call us instead.");
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-amber">Contact</span> Us
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Have a problem? Tell us about it and we will get back to you, or
            call us directly for faster service.
          </p>
        </div>
      </section>

      {/* Phone Banner */}
      <section className="bg-amber py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-white font-semibold mb-1">Fastest way to reach us:</p>
          <a href="tel:8125643719" className="text-white text-3xl md:text-4xl font-bold hover:underline">
            (812) 564-3719
          </a>
          <p className="text-white/80 text-sm mt-1">We answer our phones. Call anytime.</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

            {status === "success" && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
                Thank you! We received your message and will get back to you
                soon.
              </div>
            )}

            {status === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="serviceType" className="block text-sm font-semibold mb-1">
                  Service Type *
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent bg-white"
                >
                  <option value="">Select a service...</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                  <option value="Commercial Kitchen">Commercial Kitchen</option>
                  <option value="Handyman">Handyman</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-1">
                  Message / Problem Description *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent resize-vertical"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-amber hover:bg-amber-dark text-white font-bold py-4 rounded-lg text-lg transition-colors min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="font-bold text-lg mb-2">Call Us</h3>
                <a
                  href="tel:8125643719"
                  className="text-amber text-xl font-bold hover:text-amber-dark transition-colors"
                >
                  (812) 564-3719
                </a>
                <p className="text-gray-600 text-sm mt-1">
                  Fastest way to get help
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="font-bold text-lg mb-2">Book Online</h3>
                <a
                  href="/book"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber font-semibold hover:text-amber-dark transition-colors"
                >
                  Schedule an Appointment
                </a>
                <p className="text-gray-600 text-sm mt-1">
                  Pick a time that works for you
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="font-bold text-lg mb-2">Find Us on Facebook</h3>
                <a
                  href="https://www.facebook.com/profile.php?id=61574237036155"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber font-semibold hover:text-amber-dark transition-colors"
                >
                  Grease &amp; Threads on Facebook
                </a>
                <p className="text-gray-600 text-sm mt-1">
                  Follow us for updates
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="font-bold text-lg mb-2">Service Area</h3>
                <p className="text-gray-600">
                  Carlisle, Sullivan, Vincennes, and surrounding areas within a
                  30-mile radius of Carlisle, Indiana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
