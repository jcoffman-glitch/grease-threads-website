import Link from "next/link";

const services = [
  {
    title: "HVAC & Mechanical",
    description: "A/C tune-ups, furnace repair, heat pumps, and maintenance.",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Appliance Repair",
    description: "Washers, dryers, stoves, microwaves, and fridges.",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
  },
  {
    title: "Commercial Kitchens",
    description: "Fryers, ovens, mixers, meat slicers, and make-up air units. Keep your business running.",
    badge: "Our Specialty",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    title: "Handyman Services",
    description: "Small repairs, assembly, and general maintenance.",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.383a2.066 2.066 0 01-2.922-2.922L8.498 12.25m3.922 2.92L19.8 7.794a2.735 2.735 0 00-3.866-3.866l-7.38 7.38m3.866 3.862l-2.758 2.758m0 0l-1.543 1.543" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Simple, Honest Repair.{" "}
            <span className="text-amber">No Guessing. No Games.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            HVAC, appliance repair, and commercial kitchen service for Carlisle
            and a 30-mile radius.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8125643719"
              className="bg-amber hover:bg-amber-dark text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
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

      {/* $75 Diagnostic */}
      <section className="bg-amber py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Start with a $75 Diagnostic.
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            We will find the problem, tell you the truth, and give you a fair
            price to fix it. Servicing Carlisle, Sullivan, Vincennes, and
            surrounding areas.
          </p>
        </div>
      </section>

      {/* Services Cards */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What We <span className="text-amber">Fix</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 relative"
              >
                {service.badge && (
                  <span className="absolute top-4 right-4 bg-amber text-white text-xs font-bold px-3 py-1 rounded-full">
                    {service.badge}
                  </span>
                )}
                <div className="text-amber mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/services"
              className="bg-navy hover:bg-charcoal text-white font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* About / Story */}
      <section className="bg-navy text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            45 Years of <span className="text-amber">Solving Problems.</span>
          </h2>
          <div className="text-gray-300 space-y-4 text-lg leading-relaxed">
            <p>
              I spent 30 years as a paramedic and 15 years in municipal water
              treatment. In those jobs, you do not guess — you find the facts
              and fix the problem correctly the first time.
            </p>
            <p>
              But I have always had grease on my hands. Outside of my career, I
              have spent decades as a mechanic, doing full home remodels, and
              serving as the jack of all trades for my neighbors and community.
            </p>
            <p>
              Whether it is a furnace that will not kick on, a washer that is
              leaking, or a fryer down in a busy kitchen, I have likely seen it
              and fixed it before. I am semi-retired now, but I still believe in
              doing a job right.
            </p>
            <p className="text-amber font-semibold">
              Most guys will try to sell you a whole new unit or a $500 control
              board you do not need. I would rather fix what you have and earn
              your trust.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/about"
              className="bg-amber hover:bg-amber-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Get It Fixed?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Call us or book online. We will take care of the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8125643719"
              className="bg-amber hover:bg-amber-dark text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
            >
              Call (812) 564-3719
            </a>
            <a
              href="https://calendar.app.google/NEBSdUFjbUY7yPxF6"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-navy hover:bg-charcoal text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
            >
              Book Online Now
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
