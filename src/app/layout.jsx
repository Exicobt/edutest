import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import AuthProvider from "@/components/AuthProvider"
import TombolSuara from "@/components/TombolSuara"
import { Toaster } from "react-hot-toast"

const display = Bricolage_Grotesque({
  variable: "--f-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

const body = Plus_Jakarta_Sans({
  variable: "--f-body",
  subsets: ["latin"],
})

export const metadata = {
  title: "EduTest - Kuis Online untuk Belajar",
  description:
    "Gabung kuis dengan kode, mainkan kuis publik, atau buat kuismu sendiri. Uji kemampuanmu dan lihat hasilnya langsung.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <TombolSuara />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                border: "2px solid #1b2030",
                borderRadius: "12px",
                color: "#1b2030",
                fontWeight: 600,
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
