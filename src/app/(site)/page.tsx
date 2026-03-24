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

const testimonials = [
  {
    name: "Miles McIntosh",
    badge: "Local Guide",
    text: "Shows up when he says he will. He was running behind one day but texted to let us know. Got our repairs done and installed a light in a quick efficient time.",
  },
  {
    name: "Barbara Horton",
    badge: null,
    text: "Great guys, will do the best job keeping the prices affordable, and won't just blow smoke to get the job. They are honest and dependable to get the job done right.",
  },
  {
    name: "Lacey Bond",
    badge: "Local Guide",
    text: "Friendly, best, good repair service around!!",
  },
  {
    name: "Acacia Coffman",
    badge: null,
    text: "Can get the job done in a timely manner and very professional",
  },
];

export default function Home() {
  return (
    <main className="pb-16 md:pb-0">
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

      {/* Trust Bar */}
      <section className="bg-amber py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl md:text-4xl font-bold">30+</div>
              <div className="text-sm md:text-base font-medium text-white/90 mt-1">Years Experience</div>
            </div>
            <div className="border-x border-white/30">
              <div className="text-2xl md:text-4xl font-bold">30-Mile</div>
              <div className="text-sm md:text-base font-medium text-white/90 mt-1">Service Radius</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-bold">$75</div>
              <div className="text-sm md:text-base font-medium text-white/90 mt-1">Flat Diagnostic</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How It <span className="text-amber">Works</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Call or Book Online",
                desc: "Give us a call at (812) 564-3719 or use our online scheduler. We'll get you on the calendar fast.",
              },
              {
                step: "2",
                title: "We Come to You",
                desc: "We drive out to your home or business anywhere within 30 miles of Carlisle. No shop drop-off needed.",
              },
              {
                step: "3",
                title: "Fixed Right or You Don't Pay",
                desc: "We diagnose it, tell you the truth, and fix it right. If we can't fix it, you don't owe us for the repair.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-navy text-amber rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
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

      {/* Why Us */}
      <section className="bg-navy text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Why <span className="text-amber">Grease &amp; Threads?</span>
          </h2>
          <div className="text-gray-300 space-y-4 text-lg leading-relaxed">
            <p>
              I spent 30 years as a paramedic and 15 years in municipal water
              treatment. In those jobs, you don&apos;t guess — you find the facts
              and fix the problem correctly the first time.
            </p>
            <p>
              But I&apos;ve always had grease on my hands. Decades as a mechanic,
              full home remodels, the jack of all trades for my neighbors and
              community. Whether it&apos;s a furnace that won&apos;t kick on or a fryer
              down in a busy kitchen, I&apos;ve likely seen it and fixed it before.
            </p>
            <blockquote className="border-l-4 border-amber pl-6 mt-6">
              <p className="text-white text-xl font-semibold italic">
                &ldquo;Most guys would&apos;ve sold you a part. We don&apos;t. Right is right.&rdquo;
              </p>
            </blockquote>
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

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            What Customers <span className="text-amber">Say</span>
          </h2>
          <p className="text-center text-amber font-bold text-lg mb-1">5.0 ★ on Google</p>
          <p className="text-center text-gray-500 text-sm mb-10">Real reviews from real customers</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="text-amber text-xl mb-3">★★★★★</div>
                <p className="text-gray-700 italic mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-semibold text-navy text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">
                      {t.badge && <span className="mr-1">{t.badge} ·</span>}
                      via Google
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a
              href="https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-navy hover:bg-charcoal text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              ⭐ Leave a Review
            </a>
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
            Call us or book online. We&apos;ll take care of the rest.
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

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-navy border-t border-white/20 flex">
        <a
          href="tel:8125643719"
          className="flex-1 flex items-center justify-center gap-2 py-4 text-white font-bold text-sm bg-navy hover:bg-navy/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Call Now
        </a>
        <div className="w-px bg-white/20" />
        <a
          href="https://calendar.app.google/NEBSdUFjbUY7yPxF6"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-4 text-navy font-bold text-sm bg-amber hover:bg-amber-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Book Online
        </a>
      </div>
    </main>
  );
}
