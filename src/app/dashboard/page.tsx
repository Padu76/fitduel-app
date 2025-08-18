  // ====================================
  // CHECK AUTHENTICATION - NO AUTO GUEST
  // ====================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. PRIMA controlla Supabase direttamente
        const supabase = createClientComponentClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Authenticated with Supabase:', session.user.email)
          setIsLoading(false)
          return
        }

        // 2. Controlla lo store Zustand
        if (isAuthenticated) {
          console.log('✅ Authenticated via store')
          setIsLoading(false)
          return
        }

        // 3. Aspetta un attimo per dare tempo allo store di inizializzarsi
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 4. Ricontrolla dopo il delay
        if (isAuthenticated) {
          console.log('✅ Authentication found after delay')
          setIsLoading(false)
          return
        }

        // 5. NO GUEST CREATION - REDIRECT TO LOGIN
        console.log('❌ No authentication found, redirecting to /login')
        router.push('/login')

      } catch (error) {
        console.error('Auth check error:', error)
        // In caso di errore, redirect a login per sicurezza
        router.push('/login')
      }
    }

    checkAuth()
  }, [isAuthenticated, router])