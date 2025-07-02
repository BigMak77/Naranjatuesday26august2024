// app/(admin)/layout.tsx
import Header from '@/components/AdminHeader'
import Footer from '@/components/Footer'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-teal-900">
      <Header />

      <main className="flex-grow bg-teal-900 px-6 py-12">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
