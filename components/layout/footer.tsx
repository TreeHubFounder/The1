
import Link from 'next/link';
import { TreePine, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2E4628] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <TreePine className="h-8 w-8 text-[#FF7A00]" />
              <span className="text-xl font-bold tracking-tight">TreeHub</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-sm">
              The professional hub for the tree care industry. Connecting arborists, companies, and equipment suppliers nationwide.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@treehub.app" className="hover:text-[#FF7A00] transition-colors">
                  support@treehub.app
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+18008733482" className="hover:text-[#FF7A00] transition-colors">
                  1-800-TREEHUB
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Nationwide Service</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/jobs" className="hover:text-[#FF7A00] transition-colors">
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="/professionals" className="hover:text-[#FF7A00] transition-colors">
                  Hire Professionals
                </Link>
              </li>
              <li>
                <Link href="/equipment" className="hover:text-[#FF7A00] transition-colors">
                  Equipment Marketplace
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="hover:text-[#FF7A00] transition-colors">
                  Emergency Response
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/safety" className="hover:text-[#FF7A00] transition-colors">
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link href="/certifications" className="hover:text-[#FF7A00] transition-colors">
                  Certifications
                </Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-[#FF7A00] transition-colors">
                  Training Programs
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#FF7A00] transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/about" className="hover:text-[#FF7A00] transition-colors">
                  About TreeHub
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FF7A00] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © {currentYear} TreeHub. Built by tree pros, for tree pros.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-gray-300 text-sm">🌲 Professional Tree Care Network</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
