import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold mb-2">same dev</h3>
            <p className="text-gray-400 text-sm">Speed up your design workflow</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Plans
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  AI UI Generator
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  AI Wireframe Generator
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Website Design
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Mockup
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Prototype
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Image to HTML
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Figma AI
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Figma Plugin</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  UX / UI Design
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Affiliates
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  We&apos;re hiring 🔥
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  support@samedotdev.ai
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-6">
              <h4 className="font-semibold mb-4">Follow</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    LinkedIn
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    TikTok
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Read</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Galileo
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">©2025 same dev AI ❤️ Proudly bootstrapped</p>
          <div className="flex space-x-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
