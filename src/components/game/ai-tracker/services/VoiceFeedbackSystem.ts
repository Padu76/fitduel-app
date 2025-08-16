// src/components/game/ai-tracker/services/VoiceFeedbackSystem.ts

export class VoiceFeedbackSystem {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private enabled: boolean = true
  private language: string = 'it-IT'
  private volume: number = 0.9
  private rate: number = 1.1
  private pitch: number = 1.0

  constructor(language: string = 'it-IT') {
    this.language = language
    this.initialize()
  }

  private initialize() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()
      
      // Reload voices when they change
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices()
      }
    } else {
      console.warn('Speech synthesis not supported in this browser')
    }
  }

  private loadVoices() {
    if (!this.synth) return

    const voices = this.synth.getVoices()
    
    // Try to find a voice for the specified language
    this.voice = voices.find(v => v.lang === this.language) || 
                 voices.find(v => v.lang.startsWith(this.language.split('-')[0])) ||
                 voices[0]
    
    if (this.voice) {
      console.log(`Voice loaded: ${this.voice.name} (${this.voice.lang})`)
    }
  }

  speak(text: string, priority: 'high' | 'normal' | 'low' = 'normal') {
    if (!this.synth || !this.enabled) return

    // Cancel current speech for high priority
    if (priority === 'high') {
      this.synth.cancel()
    }

    // Don't interrupt high priority with lower priority
    if (priority === 'low' && this.synth.speaking) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = this.voice
    utterance.lang = this.language
    utterance.rate = this.rate
    utterance.pitch = this.pitch
    utterance.volume = this.volume

    this.synth.speak(utterance)
  }

  // Exercise-specific feedback methods
  countRep(count: number) {
    this.speak(count.toString(), 'high')
  }

  encouragement() {
    const phrases = this.getEncouragementPhrases()
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    this.speak(randomPhrase, 'low')
  }

  correction(mistake: string) {
    const corrections = this.getCorrectionPhrases()
    if (corrections[mistake]) {
      this.speak(corrections[mistake], 'high')
    }
  }

  startExercise(exerciseName: string) {
    const message = this.language.startsWith('it') 
      ? `Iniziamo con ${exerciseName}. Preparati!`
      : `Let's start with ${exerciseName}. Get ready!`
    this.speak(message, 'high')
  }

  endExercise(reps: number, formScore: number) {
    const message = this.language.startsWith('it')
      ? `Esercizio completato! ${reps} ripetizioni con forma ${Math.round(formScore)}%. ${formScore > 80 ? 'Ottimo lavoro!' : 'Continua a migliorare!'}`
      : `Exercise completed! ${reps} reps with ${Math.round(formScore)}% form. ${formScore > 80 ? 'Great job!' : 'Keep improving!'}`
    this.speak(message, 'high')
  }

  countdown(seconds: number) {
    if (seconds <= 3 && seconds > 0) {
      this.speak(seconds.toString(), 'high')
    } else if (seconds === 0) {
      this.speak(this.language.startsWith('it') ? 'Via!' : 'Go!', 'high')
    }
  }

  milestone(type: 'halfway' | 'almost' | 'last') {
    const messages = {
      halfway: this.language.startsWith('it') ? 'Metà completata!' : 'Halfway there!',
      almost: this.language.startsWith('it') ? 'Quasi finito!' : 'Almost done!',
      last: this.language.startsWith('it') ? 'Ultima ripetizione!' : 'Last rep!'
    }
    this.speak(messages[type], 'normal')
  }

  // Configuration methods
  toggle(): boolean {
    this.enabled = !this.enabled
    if (this.enabled) {
      this.speak(this.language.startsWith('it') ? 'Audio attivato' : 'Audio enabled', 'low')
    }
    return this.enabled
  }

  setLanguage(lang: string) {
    this.language = lang
    this.loadVoices()
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2, rate))
  }

  setPitch(pitch: number) {
    this.pitch = Math.max(0.5, Math.min(2, pitch))
  }

  // Helper methods
  private getEncouragementPhrases(): string[] {
    if (this.language.startsWith('it')) {
      return [
        'Ottimo lavoro!',
        'Continua così!',
        'Perfetto!',
        'Molto bene!',
        'Eccellente!',
        'Grande forma!',
        'Stai andando forte!',
        'Fantastico!',
        'Bravo!',
        'Forza!'
      ]
    } else {
      return [
        'Great job!',
        'Keep it up!',
        'Perfect!',
        'Very good!',
        'Excellent!',
        'Great form!',
        'You\'re doing great!',
        'Fantastic!',
        'Well done!',
        'Keep going!'
      ]
    }
  }

  private getCorrectionPhrases(): Record<string, string> {
    if (this.language.startsWith('it')) {
      return {
        'back_not_straight': 'Mantieni la schiena dritta',
        'elbows_too_wide': 'Avvicina i gomiti al corpo',
        'elbows_not_aligned': 'Allinea i gomiti',
        'knees_inward': 'Ginocchia in linea con i piedi',
        'knees_past_toes': 'Non far superare le ginocchia le punte dei piedi',
        'hips_too_high': 'Abbassa i fianchi',
        'hips_too_low': 'Alza i fianchi',
        'depth_insufficient': 'Scendi di più',
        'speed_too_fast': 'Rallenta il movimento',
        'speed_too_slow': 'Aumenta il ritmo',
        'body_not_straight': 'Mantieni il corpo in linea retta',
        'arms_not_wide': 'Apri di più le braccia',
        'arms_not_up': 'Alza le braccia sopra la testa',
        'feet_not_aligned': 'Allinea i piedi',
        'head_position': 'Guarda avanti',
        'breathing': 'Ricorda di respirare',
        'core_not_engaged': 'Contrai gli addominali',
        'shoulders_raised': 'Rilassa le spalle',
        'wrists_bent': 'Mantieni i polsi dritti'
      }
    } else {
      return {
        'back_not_straight': 'Keep your back straight',
        'elbows_too_wide': 'Bring elbows closer to body',
        'elbows_not_aligned': 'Align your elbows',
        'knees_inward': 'Keep knees aligned with feet',
        'knees_past_toes': 'Don\'t let knees pass toes',
        'hips_too_high': 'Lower your hips',
        'hips_too_low': 'Raise your hips',
        'depth_insufficient': 'Go deeper',
        'speed_too_fast': 'Slow down the movement',
        'speed_too_slow': 'Increase the pace',
        'body_not_straight': 'Keep body in straight line',
        'arms_not_wide': 'Open arms wider',
        'arms_not_up': 'Raise arms above head',
        'feet_not_aligned': 'Align your feet',
        'head_position': 'Look forward',
        'breathing': 'Remember to breathe',
        'core_not_engaged': 'Engage your core',
        'shoulders_raised': 'Relax your shoulders',
        'wrists_bent': 'Keep wrists straight'
      }
    }
  }

  // Cleanup
  cleanup() {
    if (this.synth) {
      this.synth.cancel()
    }
  }
}