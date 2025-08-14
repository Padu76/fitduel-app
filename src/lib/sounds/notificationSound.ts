// Componente per gestire il suono delle notifiche
// Salva questo file in: /src/lib/sounds/notificationSound.ts

export class NotificationSound {
  private audio: HTMLAudioElement | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      // Suono di notifica in Base64 (suono breve "ding")
      // Questo è un suono royalty-free molto leggero
      const soundBase64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
      
      this.audio = new Audio(soundBase64)
      this.audio.volume = 0.5
    }
  }

  play() {
    if (this.audio && this.enabled) {
      try {
        // Clone the audio to allow multiple plays
        const audioClone = this.audio.cloneNode() as HTMLAudioElement
        audioClone.volume = this.audio.volume
        audioClone.play().catch(e => {
          console.log('Could not play notification sound:', e)
        })
      } catch (error) {
        console.error('Error playing notification sound:', error)
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }
}

// Export singleton instance
export const notificationSound = new NotificationSound()