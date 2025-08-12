"use client"

import { track } from "@vercel/analytics"

export default function BallMachineBanner() {
  const handleClick = () => {
    track('banner_seattle_ball_machine_clicked', {
      location: 'static_landing_page',
      timestamp: new Date().toISOString()
    })
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 text-center">
      <a 
        href="https://seattleballmachine.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-sm md:text-base font-medium hover:underline"
        onClick={handleClick}
      >
        🎾 Need a ball machine for practice? Check out Seattle Ball Machine →
      </a>
    </div>
  )
}