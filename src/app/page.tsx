import Link from 'next/link'
import { Trophy, Zap, Users, Target, Sparkles, Timer, Shield, TrendingUp, Swords, Flame, Medal, Crown } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950">
      {/* Navbar */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Swords className="w-8 h-8 text-indigo-500" />
              <Flame className="w-4 h-4 text-orange-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FitDuel
            </span>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Accedi
            </Link>
            <Link 
              href="/register" 
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition transform hover:scale-105"
            >
              Inizia a Sfidare
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-400">Nuovo: Tornei Settimanali con Premi Reali!</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Sfida. Allenati.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Domina.
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Trasforma ogni workout in un duello epico. Sfida amici e rivali, 
            conquista la classifica, diventa il campione definitivo del fitness!
          </p>
          
          <div className="flex gap-4 justify-center mb-20">
            <Link 
              href="/register" 
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-bold text-lg transition transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              Accetta la Sfida
              <Swords className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 rounded-xl font-bold text-lg transition"
            >
              Come Funziona
            </Link>
          </div>

          {/* Live Stats Bar */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 blur-3xl -z-10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400 flex items-center justify-center gap-1">
                <Users className="w-6 h-6" />
                12K+
              </div>
              <div className="text-sm text-gray-500">Duellanti Attivi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 flex items-center justify-center gap-1">
                <Swords className="w-6 h-6" />
                75K+
              </div>
              <div className="text-sm text-gray-500">Duelli Completati</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 flex items-center justify-center gap-1">
                <Crown className="w-6 h-6" />
                500+
              </div>
              <div className="text-sm text-gray-500">Campioni Coronati</div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-20" id="how-it-works">
            <h2 className="text-3xl font-bold mb-12">Come Funziona FitDuel</h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="relative">
                <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-4 mx-auto">1</div>
                <h3 className="font-semibold mb-2">Scegli la Sfida</h3>
                <p className="text-sm text-gray-400">Push-up, squat o plank - tu decidi l'arena</p>
              </div>
              <div className="relative">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-4 mx-auto">2</div>
                <h3 className="font-semibold mb-2">Lancia il Duello</h3>
                <p className="text-sm text-gray-400">Sfida un amico o trova un rivale random</p>
              </div>
              <div className="relative">
                <div className="bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-4 mx-auto">3</div>
                <h3 className="font-semibold mb-2">Completa l'Esercizio</h3>
                <p className="text-sm text-gray-400">L'AI valuta la tua forma e performance</p>
              </div>
              <div className="relative">
                <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-4 mx-auto">4</div>
                <h3 className="font-semibold mb-2">Vinci e Sali</h3>
                <p className="text-sm text-gray-400">Guadagna XP, badge e scala la classifica</p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-20" id="features">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-indigo-600 transition hover:transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
              <Trophy className="w-12 h-12 text-yellow-500 mb-4 mx-auto relative z-10" />
              <h3 className="text-xl font-bold mb-3">Duelli 1v1</h3>
              <p className="text-gray-400">
                Sfide dirette contro amici o avversari casuali. 
                Solo uno può vincere!
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-indigo-600 transition hover:transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
              <Medal className="w-12 h-12 text-green-500 mb-4 mx-auto relative z-10" />
              <h3 className="text-xl font-bold mb-3">Sistema Ranking</h3>
              <p className="text-gray-400">
                XP, livelli, badge esclusivi. Ogni vittoria 
                ti avvicina alla leggenda!
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-indigo-600 transition hover:transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              <Crown className="w-12 h-12 text-blue-500 mb-4 mx-auto relative z-10" />
              <h3 className="text-xl font-bold mb-3">Tornei Epic</h3>
              <p className="text-gray-400">
                Eventi settimanali con classifiche globali 
                e premi per i migliori!
              </p>
            </div>
          </div>

          {/* Secondary Features */}
          <div className="grid md:grid-cols-4 gap-6 mt-16 mb-20">
            <div className="text-center">
              <Timer className="w-8 h-8 text-indigo-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-1">Duelli Rapidi</h4>
              <p className="text-sm text-gray-500">30 secondi - 5 minuti max</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-purple-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-1">AI Judge</h4>
              <p className="text-sm text-gray-500">Valutazione forma imparziale</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-1">Stats Dettagliate</h4>
              <p className="text-sm text-gray-500">Traccia ogni progresso</p>
            </div>
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-1">Reward Esclusivi</h4>
              <p className="text-sm text-gray-500">Skin, titoli, badge rari</p>
            </div>
          </div>

          {/* Testimonials/Social Proof */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold mb-8 text-gray-300">I Nostri Campioni</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold">Marco_Fit</div>
                    <div className="text-xs text-gray-500">Livello 42</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic">
                  "Da quando uso FitDuel, non salto più un allenamento. 
                  La competizione mi spinge al massimo!"
                </p>
              </div>
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold">GiuliaWarrior</div>
                    <div className="text-xs text-gray-500">Livello 38</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic">
                  "Ho battuto tutti i miei amici nei duelli di plank. 
                  Sono imbattibile ora! 💪"
                </p>
              </div>
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold">TheRock99</div>
                    <div className="text-xs text-gray-500">Livello 51</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic">
                  "FitDuel ha trasformato il fitness in un gioco. 
                  Non vedo l'ora del prossimo torneo!"
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-12 backdrop-blur-sm border border-indigo-800/50">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Pronto per il Tuo Primo Duello?</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Unisciti a migliaia di duellanti che hanno trasformato il fitness in una battaglia epica per la gloria.
            </p>
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold text-lg transition transform hover:scale-105"
            >
              Entra nell'Arena
              <Swords className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-400 mt-4">
              Gratis per sempre • Nessuna carta richiesta • Inizia in 30 secondi
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 py-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Swords className="w-6 h-6 text-indigo-500" />
                <span className="text-lg font-bold text-gray-400">FitDuel</span>
              </div>
              <div className="flex gap-6">
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300">Privacy</Link>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300">Termini</Link>
                <Link href="/support" className="text-sm text-gray-500 hover:text-gray-300">Supporto</Link>
                <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-300">Blog</Link>
              </div>
              <div className="text-sm text-gray-500">
                © 2024 FitDuel. Ready to duel?
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}