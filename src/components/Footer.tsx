import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Business info */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              <span className="text-amber">Grease</span> &amp;{" "}
              <span className="text-amber">Threads</span>
            </h3>
            <p className="text-gray-300 text-sm">
              HVAC and Mechanical Services
            </p>
            <p className="text-gray-300 text-sm mt-1">Carlisle, Indiana</p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-bold mb-3">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/services"
                className="text-gray-300 hover:text-amber transition-colors text-sm"
              >
                Services
              </Link>
              <Link
                href="/about"
                className="text-gray-300 hover:text-amber transition-colors text-sm"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-300 hover:text-amber transition-colors text-sm"
              >
                Contact
              </Link>
              <a
                href="https://calendar.app.google/NEBSdUFjbUY7yPxF6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-amber transition-colors text-sm"
              >
                Book Online
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-3">Contact</h3>
            <div className="flex flex-col gap-2">
              <a
                href="tel:8125643719"
                className="text-amber hover:text-amber-light transition-colors font-semibold"
              >
                (812) 564-3719
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61574237036155"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-amber transition-colors text-sm inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
              <a
                href="https://calendar.app.google/NEBSdUFjbUY7yPxF6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-amber transition-colors text-sm"
              >
                Book Online
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Grease &amp; Threads HVAC and
            Mechanical Services. All rights reserved.
          </p>
          <p className="mt-1">
            <a
              href="https://www.greasethreads.com"
              className="hover:text-amber transition-colors"
            >
              www.greasethreads.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
