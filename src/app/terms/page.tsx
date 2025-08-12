'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Shield, FileText, Scale, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function TermsPage() {
  const sections = [
    {
      id: 'intro',
      title: '1. Introduzione',
      content: `Benvenuto su FitDuel! Utilizzando la nostra piattaforma, accetti i presenti Termini di Servizio. 
      Ti preghiamo di leggerli attentamente prima di utilizzare l'applicazione.`
    },
    {
      id: 'uso',
      title: '2. Uso della Piattaforma',
      content: `FitDuel è una piattaforma di fitness gamificata che permette agli utenti di:
      • Partecipare a sfide fitness con altri utenti
      • Monitorare i propri progressi attraverso un sistema di livelli e XP
      • Sbloccare achievement e badge
      • Competere nelle classifiche globali
      
      Gli utenti devono avere almeno 16 anni per utilizzare la piattaforma.`
    },
    {
      id: 'account',
      title: '3. Account Utente',
      content: `Sei responsabile per:
      • Mantenere la confidenzialità delle tue credenziali
      • Tutte le attività che avvengono tramite il tuo account
      • Fornire informazioni accurate e aggiornate
      • Non creare account multipli o falsi`
    },
    {
      id: 'condotta',
      title: '4. Codice di Condotta',
      content: `Gli utenti si impegnano a:
      • Rispettare tutti gli altri utenti della piattaforma
      • Non utilizzare linguaggio offensivo o inappropriato
      • Non barare o utilizzare exploit nelle sfide
      • Non condividere contenuti inappropriati
      • Seguire le regole del fair play`
    },
    {
      id: 'sfide',
      title: '5. Sfide e Competizioni',
      content: `Le sfide su FitDuel sono validate attraverso:
      • Rilevamento del movimento tramite webcam
      • Algoritmi di AI per verificare la corretta esecuzione
      • Sistema anti-cheat integrato
      
      FitDuel si riserva il diritto di annullare risultati sospetti o fraudolenti.`
    },
    {
      id: 'premi',
      title: '6. Sistema di Premi e XP',
      content: `I punti XP, coins e achievement:
      • Sono virtuali e non hanno valore monetario reale
      • Non possono essere trasferiti o venduti
      • Possono essere revocati in caso di violazioni
      • Sono soggetti a modifiche per bilanciamento del gioco`
    },
    {
      id: 'privacy',
      title: '7. Privacy e Dati',
      content: `FitDuel rispetta la tua privacy:
      • I dati della webcam sono processati localmente
      • Non salviamo video o immagini delle tue sessioni
      • I dati personali sono protetti secondo GDPR
      • Puoi richiedere la cancellazione del tuo account in qualsiasi momento`
    },
    {
      id: 'responsabilita',
      title: '8. Limitazione di Responsabilità',
      content: `FitDuel non è responsabile per:
      • Infortuni derivanti dall'esecuzione degli esercizi
      • Perdita di dati o progressi
      • Interruzioni temporanee del servizio
      
      Si consiglia di consultare un medico prima di iniziare qualsiasi programma di fitness.`
    },
    {
      id: 'modifiche',
      title: '9. Modifiche ai Termini',
      content: `FitDuel si riserva il diritto di modificare questi termini in qualsiasi momento. 
      Gli utenti saranno notificati di cambiamenti significativi via email o tramite l'app.`
    },
    {
      id: 'contatti',
      title: '10. Contatti',
      content: `Per domande sui presenti termini, contattaci a:
      • Email: support@fitduel.app
      • Discord: discord.gg/fitduel
      • Twitter: @fitduelapp`
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
              <Scale className="w-5 h-5 text-indigo-500" />
              <h1 className="text-xl font-bold text-white">Termini di Servizio</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Last Update */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-4 bg-indigo-500/10 border-indigo-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm text-indigo-400 font-medium">Ultimo aggiornamento: 13 Agosto 2025</p>
                <p className="text-xs text-gray-400">Versione 1.0.0</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Indice
            </h2>
            <div className="grid md:grid-cols-2 gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card variant="glass" className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  {section.title}
                </h2>
                <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pb-8"
        >
          <Card variant="glass" className="p-6 text-center">
            <p className="text-gray-400 mb-4">
              Utilizzando FitDuel, accetti questi Termini di Servizio e la nostra{' '}
              <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                Privacy Policy
              </Link>
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button variant="secondary">
                  Torna alla Dashboard
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="gradient">
                  Leggi Privacy Policy
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}