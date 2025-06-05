import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Database, Shield, Upload } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Lead Management System</h1>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Comprehensive Lead Management Solution</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Upload, clean, process, and distribute leads with advanced analytics and ROI tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/setup-database">
                <Button size="lg" variant="outline" className="px-8">
                  Setup Database <Database className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Upload className="h-10 w-10 text-blue-500" />}
                title="Lead Processing"
                description="Upload, clean, and normalize lead data from various sources with automatic field mapping."
              />
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-red-500" />}
                title="DNC Protection"
                description="Manage Do Not Contact lists and automatically filter leads against multiple DNC sources."
              />
              <FeatureCard
                icon={<Database className="h-10 w-10 text-green-500" />}
                title="Lead Distribution"
                description="Distribute leads to clients based on percentage allocation or fixed numbers."
              />
              <FeatureCard
                icon={<BarChart3 className="h-10 w-10 text-purple-500" />}
                title="ROI Analytics"
                description="Track lead performance, costs, and revenue with comprehensive analytics."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-lg font-semibold mb-4 md:mb-0">Lead Management System</p>
            <div className="flex space-x-8">
              <Link href="/about" className="hover:text-blue-400 transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-blue-400 transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Lead Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2 text-gray-900">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
