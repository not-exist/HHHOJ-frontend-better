import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from '@/components/NavBar'
import Particles from '@/components/Particles'
import Footer from '@/components/Footer'
import { useTheme } from '@/context/ThemeContext'

export default function MainLayout() {
  const { particles } = useTheme()
  const location = useLocation()

  return (
    <div className="app-shell">
      {particles && <Particles />}
      <NavBar />
      <main className="page-main">
        <div className="container page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
