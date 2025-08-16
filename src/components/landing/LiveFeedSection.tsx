'use client'

interface FeedItem {
  avatar: string
  name: string
  action: string
  detail: string
}

const liveFeed: FeedItem[] = [
  { avatar: 'M', name: 'Marco', action: 'ha battuto Luigi', detail: 'Push-ups +150 XP' },
  { avatar: 'S', name: 'Sara', action: 'streak 7 giorni!', detail: '+500 XP' },
  { avatar: 'T', name: 'Team Alpha', action: 'vince il torneo!', detail: '+1000 XP' },
  { avatar: 'L', name: 'Luca', action: 'nuovo record!', detail: '45 squats +200 XP' },
  { avatar: 'A', name: 'Anna', action: 'sblocca skin Epic!', detail: 'Level 25' },
  { avatar: 'G', name: 'Giovanni', action: 'completa missione!', detail: 'Warrior Badge +300 XP' },
  { avatar: 'F', name: 'Francesca', action: '10 vittorie oggi!', detail: 'Fire Streak +750 XP' },
  { avatar: 'R', name: 'Roberto', action: 'perfect form!', detail: '100% accuracy +400 XP' }
]

export default function LiveFeedSection() {
  return (
    <section className="py-8 bg-gradient-to-r from-green-400/10 to-blue-500/10 border-y border-green-400/30 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="px-6 font-black text-green-400 whitespace-nowrap flex items-center gap-2">
          <span className="animate-pulse">🔴</span>
          <span>LIVE NOW</span>
        </div>
        
        <div className="flex gap-8 animate-scroll">
          {/* Duplicate feed for seamless loop */}
          {[...liveFeed, ...liveFeed].map((item, index) => (
            <FeedCard key={index} item={item} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
          display: flex;
          gap: 2rem;
        }
      `}</style>
    </section>
  )
}

// Sub-component for individual feed card
function FeedCard({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-3 bg-gray-900/50 px-6 py-3 rounded-full whitespace-nowrap backdrop-blur-sm border border-gray-800 hover:border-green-400/50 transition-colors">
      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-black shadow-lg">
        {item.avatar}
      </div>
      <div className="text-sm">
        <span className="text-green-400 font-bold">{item.name}</span>
        <span className="text-gray-300"> {item.action}</span>
        <span className="text-gray-500"> • </span>
        <span className="text-blue-400">{item.detail}</span>
      </div>
    </div>
  )
}