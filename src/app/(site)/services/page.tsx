import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Grease & Threads HVAC and Mechanical Services",
  description:
    "HVAC repair, appliance repair, commercial kitchen service, and handyman work in Carlisle, Indiana and surrounding areas.",
};

const services = [
  {
    title: "HVAC & Mechanical",
    items: [
      "Air conditioning tune-ups and repair",
      "Furnace repair and maintenance",
      "Heat pump installation and service",
      "Ductwork inspection and repair",
      "Thermostat troubleshooting",
      "Seasonal maintenance plans",
    ],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Appliance Repair",
    items: [
      "Washer and dryer repair",
      "Refrigerator and freezer service",
      "Stove and oven repair",
      "Microwave repair",
      "Dishwasher troubleshooting",
      "Most major brands serviced",
    ],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
  },
  {
    title: "Commercial Kitchens",
    badge: "Our Specialty",
    items: [
      "Commercial fryer repair and maintenance",
      "Commercial oven and range service",
      "Mixer and food prep equipment repair",
      "Meat slicer service and blade sharpening",
      "Make-up air unit installation and repair",
      "Walk-in cooler and freezer service",
      "Emergency breakdown service",
    ],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    title: "Handyman Services",
    items: [
      "Small home repairs",
      "Furniture and equipment assembly",
      "General maintenance",
      "Minor plumbing fixes",
      "Electrical troubleshooting",
      "Odd jobs and projects",
    ],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.383a2.066 2.066 0 01-2.922-2.922L8.498 12.25m3.922 2.92L19.8 7.794a2.735 2.735 0 00-3.866-3.866l-7.38 7.38m3.866 3.862l-2.758 2.758m0 0l-1.543 1.543" />
      </svg>
    ),
  },
];

export default function ServicesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-amber">Services</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            From HVAC to commercial kitchens, we diagnose and fix it right the
            first time. All services start with a $75 diagnostic.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-xl p-6 md:p-8 shadow-md border border-gray-100 relative"
            >
              {service.badge && (
                <span className="absolute top-4 right-4 bg-amber text-white text-sm font-bold px-4 py-1 rounded-full">
                  {service.badge}
                </span>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-amber flex-shrink-0">{service.icon}</div>
                <h2 className="text-2xl font-bold">{service.title}</h2>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                {service.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need Something Fixed?
          </h2>
          <p className="text-white/90 text-lg mb-6">
            Call us or book online to schedule your $75 diagnostic.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8125643719"
              className="bg-navy hover:bg-charcoal text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
            >
              Call (812) 564-3719
            </a>
            <a
              href="https://calendar.app.google/NEBSdUFjbUY7yPxF6"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-100 text-navy font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
            >
              Book Online Now
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
