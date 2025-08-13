  const handleAcceptDuel = async (duelId: string) => {
    try {
      setError(null)
      
      const response = await fetch('/api/duels/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duelId: duelId,
          userId: currentUser.id
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Errore nell\'accettare la sfida')
      }

      setSuccess('Sfida accettata!')
      loadData() // Reload duels to update the status
      router.push(`/duel/${duelId}`)
    } catch (err: any) {
      console.error('Error accepting duel:', err)
      setError(err.message || 'Errore nell\'accettare la sfida')
    }
  }