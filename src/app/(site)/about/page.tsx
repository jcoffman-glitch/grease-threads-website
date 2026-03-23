import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Grease & Threads HVAC and Mechanical Services",
  description:
    "45 years of hands-on experience. Learn about Grease & Threads and our approach to honest, reliable repair in Carlisle, Indiana.",
};

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            About <span className="text-amber">Grease &amp; Threads</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Honest repair built on decades of real-world experience.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            45 Years of <span className="text-amber">Solving Problems.</span>
          </h2>
          <div className="space-y-5 text-gray-700 text-lg leading-relaxed">
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
            <p className="text-navy font-semibold text-xl border-l-4 border-amber pl-4">
              Most guys will try to sell you a whole new unit or a $500 control
              board you do not need. I would rather fix what you have and earn
              your trust.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why <span className="text-amber">Choose Us</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Honest Diagnostics</h3>
              <p className="text-gray-600">
                We tell you what is actually wrong and give you a fair price. No
                upselling, no unnecessary parts.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.383a2.066 2.066 0 01-2.922-2.922L8.498 12.25m3.922 2.92L19.8 7.794a2.735 2.735 0 00-3.866-3.866l-7.38 7.38m3.866 3.862l-2.758 2.758m0 0l-1.543 1.543" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Fix It Right</h3>
              <p className="text-gray-600">
                With 45 years of hands-on experience, we diagnose accurately and
                repair correctly the first time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Local Service</h3>
              <p className="text-gray-600">
                Proudly serving Carlisle, Sullivan, Vincennes, and everywhere
                within a 30-mile radius.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Meet the <span className="text-amber">Team</span>
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            The people behind every repair, every call, and every system we build.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Joe Coffman */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber">JC</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-1">Joe Coffman</h3>
              <p className="text-amber font-semibold text-sm text-center mb-4">
                Owner &amp; Operations Manager
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Joe spent 30 years as a paramedic and 15 years in municipal water
                treatment before founding Grease &amp; Threads. He knows how
                mechanical systems work because he has spent his career keeping
                them running. Joe handles all scheduling, estimates, promotions,
                and customer relations. Plain-speaking, honest, and he will never
                sell you something you do not need.
              </p>
            </div>

            {/* Anthoney */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber">A</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-1">Anthoney</h3>
              <p className="text-amber font-semibold text-sm text-center mb-4">
                Field Manager &amp; Lead Technician
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                When something breaks, Anthoney is the guy who actually knows
                why. With over a decade as a machinist and tool-and-die
                specialist at Futaba and Raybestos, he spent years working with
                precision equipment where getting it wrong was not an option.
                That attention to detail carried straight into HVAC — he earned
                his certification through Ivy Tech and spent two years
                maintaining commercial rooftop units and refrigeration systems at
                Wabash Valley Correctional Facility, where downtime is not just
                an inconvenience — it is a crisis. At Grease &amp; Threads,
                Anthoney leads every field job. If he cannot fix it, it probably
                cannot be fixed.
              </p>
            </div>

            {/* Coffman */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber">C</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-1">Coffman</h3>
              <p className="text-amber font-semibold text-sm text-center mb-4">
                Head of IT &amp; Systems
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Coffman manages all digital infrastructure for Grease &amp;
                Threads — the website, job tracking, backend systems, and data
                pipelines. As the business grows into building automation and
                control systems, he will be the one building them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Let Us Take a Look.
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Start with a $75 diagnostic. We will find the problem and give you a
            straight answer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8125643719"
              className="bg-amber hover:bg-amber-dark text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
            >
              Call (812) 564-3719
            </a>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 text-navy font-bold px-8 py-4 rounded-lg text-lg transition-colors min-h-[52px] inline-flex items-center justify-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
