'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Lock, Eye, Shield, Database, UserCheck, Cookie, Mail, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function PrivacyPage() {
  const sections = [
    {
      id: 'intro',
      icon: Shield,
      title: '1. Introduzione',
      content: `La tua privacy è importante per noi. Questa Privacy Policy spiega come FitDuel raccoglie, utilizza, 
      condivide e protegge le tue informazioni personali quando utilizzi la nostra piattaforma.
      
      FitDuel è conforme al Regolamento Generale sulla Protezione dei Dati (GDPR) e ad altre leggi sulla privacy applicabili.`
    },
    {
      id: 'raccolta',
      icon: Database,
      title: '2. Dati che Raccogliamo',
      content: `**Dati forniti direttamente da te:**
      • Nome utente e email
      • Data di nascita (per verificare l'età minima)
      • Foto profilo (opzionale)
      • Preferenze di allenamento
      
      **Dati raccolti automaticamente:**
      • Statistiche delle sfide (punteggi, XP, livelli)
      • Timestamp delle attività
      • Informazioni sul dispositivo (tipo browser, sistema operativo)
      • Indirizzo IP (anonimizzato)
      
      **Dati della webcam:**
      • Utilizzati SOLO per il rilevamento del movimento
      • Processati localmente sul tuo dispositivo
      • NON vengono salvati o trasmessi ai nostri server`
    },
    {
      id: 'utilizzo',
      icon: Eye,
      title: '3. Come Utilizziamo i Tuoi Dati',
      content: `Utilizziamo i tuoi dati per:
      • Fornire e migliorare i servizi di FitDuel
      • Gestire il tuo account e le tue preferenze
      • Calcolare punteggi, XP e classifiche
      • Inviare notifiche sulle sfide (se autorizzato)
      • Prevenire frodi e garantire fair play
      • Analizzare l'utilizzo della piattaforma (dati aggregati)
      • Rispondere alle tue richieste di supporto`
    },
    {
      id: 'condivisione',
      icon: UserCheck,
      title: '4. Condivisione dei Dati',
      content: `**Non vendiamo MAI i tuoi dati personali.**
      
      Condividiamo dati solo:
      • Con altri utenti: username, avatar, statistiche pubbliche (NON email o dati privati)
      • Con fornitori di servizi: hosting (Vercel), database (Supabase) - tutti conformi GDPR
      • Per obblighi legali: solo se richiesto dalla legge
      
      I tuoi dati sensibili (email, data di nascita) non sono MAI visibili ad altri utenti.`
    },
    {
      id: 'sicurezza',
      icon: Lock,
      title: '5. Sicurezza dei Dati',
      content: `Proteggiamo i tuoi dati con:
      • Crittografia SSL/TLS per tutte le comunicazioni
      • Password hashate con algoritmi sicuri (bcrypt)
      • Accesso limitato ai dati solo al personale autorizzato
      • Backup regolari e sistemi di disaster recovery
      • Monitoraggio continuo per rilevare attività sospette
      • Conformità agli standard di sicurezza del settore`
    },
    {
      id: 'cookies',
      icon: Cookie,
      title: '6. Cookie e Tecnologie Simili',
      content: `Utilizziamo cookie per:
      • Mantenere la tua sessione di login
      • Salvare le tue preferenze (tema, lingua)
      • Analizzare l'utilizzo del sito (Google Analytics - anonimizzato)
      
      **Cookie essenziali:** Necessari per il funzionamento del sito
      **Cookie funzionali:** Migliorano l'esperienza utente
      **Cookie analitici:** Ci aiutano a migliorare il servizio
      
      Puoi gestire le preferenze cookie dal tuo browser.`
    },
    {
      id: 'diritti',
      icon: UserCheck,
      title: '7. I Tuoi Diritti (GDPR)',
      content: `Hai il diritto di:
      • **Accesso:** Richiedere una copia dei tuoi dati
      • **Rettifica:** Correggere dati inesatti
      • **Cancellazione:** Richiedere l'eliminazione del tuo account
      • **Portabilità:** Ricevere i tuoi dati in formato leggibile
      • **Opposizione:** Opporti a determinati trattamenti
      • **Limitazione:** Limitare il trattamento dei tuoi dati
      
      Per esercitare questi diritti, contattaci a: privacy@fitduel.app`
    },
    {
      id: 'minori',
      icon: AlertTriangle,
      title: '8. Protezione dei Minori',
      content: `FitDuel richiede un'età minima di 16 anni.
      
      • Non raccogliamo consapevolmente dati di utenti sotto i 16 anni
      • Se scopriamo account di minori, li eliminiamo immediatamente
      • I genitori possono contattarci per rimuovere dati di minori
      • Utilizziamo verifiche dell'età durante la registrazione`
    },
    {
      id: 'conservazione',
      icon: Database,
      title: '9. Conservazione dei Dati',
      content: `Conserviamo i tuoi dati per:
      • **Account attivi:** Finché il tuo account è attivo
      • **Account eliminati:** Max 30 giorni per il ripristino
      • **Backup:** Max 90 giorni
      • **Log di sicurezza:** 1 anno
      • **Dati aggregati/anonimi:** Indefinitamente
      
      Puoi richiedere la cancellazione immediata in qualsiasi momento.`
    },
    {
      id: 'modifiche',
      icon: Mail,
      title: '10. Modifiche alla Privacy Policy',
      content: `Potremmo aggiornare questa policy per:
      • Conformarci a nuove leggi
      • Riflettere nuove funzionalità
      • Migliorare la trasparenza
      
      Ti notificheremo di modifiche significative via:
      • Email all'indirizzo registrato
      • Banner nell'app
      • Notifica al prossimo login`
    },
    {
      id: 'contatti',
      icon: Mail,
      title: '11. Contattaci',
      content: `Per domande sulla privacy o per esercitare i tuoi diritti:
      
      **Data Protection Officer:**
      Email: privacy@fitduel.app
      
      **Supporto Generale:**
      Email: support@fitduel.app
      Discord: discord.gg/fitduel
      
      **Indirizzo:**
      FitDuel App
      Via Example 123
      00100 Roma, Italia`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* GDPR Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Conforme GDPR</h2>
                  <p className="text-sm text-gray-400">I tuoi dati sono protetti secondo gli standard europei</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Ultimo aggiornamento</p>
                <p className="text-sm text-gray-300 font-medium">13 Agosto 2025</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">🔒 In Breve</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-gray-300">Non vendiamo mai i tuoi dati</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-gray-300">Webcam processata solo localmente</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-gray-300">Puoi cancellare il tuo account quando vuoi</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-gray-300">Crittografia end-to-end per dati sensibili</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const IconComponent = section.icon
            return (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card variant="glass" className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-purple-500" />
                    {section.title}
                  </h2>
                  <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {section.content.split('\n').map((paragraph, i) => {
                      // Handle bold text
                      const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                      return (
                        <p key={i} className={i > 0 ? 'mt-3' : ''}>
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>
                            }
                            return part
                          })}
                        </p>
                      )
                    })}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Your Data Rights CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <Card variant="glass" className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <div className="text-center">
              <UserCheck className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Esercita i Tuoi Diritti</h3>
              <p className="text-gray-400 mb-6">
                Vuoi accedere, modificare o cancellare i tuoi dati? Siamo qui per aiutarti.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="secondary" onClick={() => window.location.href = 'mailto:privacy@fitduel.app'}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contatta DPO
                </Button>
                <Link href="/profile">
                  <Button variant="gradient">
                    Gestisci Account
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 pb-8 text-center"
        >
          <p className="text-sm text-gray-500">
            Questa Privacy Policy è stata aggiornata il 13 Agosto 2025 • Versione 1.0.0
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Termini di Servizio
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Torna alla Dashboard
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}