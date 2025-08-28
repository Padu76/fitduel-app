// src/app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const runtime = 'nodejs' // Service Role: serve il runtime Node, non Edge
export const dynamic = 'force-dynamic'

// ---------- Validazione input ----------
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 caratteri'),
  username: z.string().min(3).max(32),
  // opzionale: se vuoi saltare la creazione profilo (di default lo creiamo)
  skipProfile: z.boolean().optional().default(false),
})

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  try {
    // ---------- Guard: env ----------
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ADMIN_SECRET = process.env.ADMIN_API_SECRET

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json(
        { success: false, error: 'SERVICE_MISCONFIGURED', message: 'Supabase env mancanti' },
        500
      )
    }

    // ---------- Auth semplice per endpoint admin ----------
    // Da inviare come: Authorization: Bearer <ADMIN_API_SECRET>
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!ADMIN_SECRET || token !== ADMIN_SECRET) {
      return json(
        { success: false, error: 'UNAUTHORIZED', message: 'Token admin mancante o non valido' },
        401
      )
    }

    // ---------- Parse body ----------
    const body = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return json(
        { success: false, error: 'BAD_REQUEST', message: 'Dati non validi', issues: parsed.error.flatten() },
        400
      )
    }
    const { email, password, username, skipProfile } = parsed.data

    // ---------- Supabase Admin client ----------
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ---------- Creazione utente via Admin API ----------
    const { data: userRes, error: adminErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // niente email di conferma
      user_metadata: { username },
    })

    if (adminErr || !userRes?.user) {
      return json(
        {
          success: false,
          error: 'ADMIN_CREATE_USER_FAILED',
          message: adminErr?.message || 'Errore Admin API',
          code: (adminErr as any)?.code ?? null,
        },
        500
      )
    }

    const user = userRes.user

    // ---------- (Opzionale) Creazione profilo app ----------
    // Usiamo Service Role -> bypass RLS. Inseriamo solo i campi minimi, il resto va a default.
    if (!skipProfile) {
      const { error: profErr } = await admin.from('profiles').insert({
        id: user.id,
        email,
        username,
      }).single()

      // Se esiste già, ignoriamo; altrimenti segnaliamo errore soft
      if (profErr && !String(profErr.message).includes('duplicate key value')) {
        // Non blocchiamo la creazione utente, ma lo comunichiamo
        return json({
          success: true,
          user: { id: user.id, email: user.email },
          warning: {
            type: 'PROFILE_INSERT_FAILED',
            message: profErr.message,
          },
        })
      }
    }

    return json({
      success: true,
      user: { id: user.id, email: user.email, created_at: user.created_at },
    })
  } catch (err: any) {
    return json(
      {
        success: false,
        error: 'UNEXPECTED',
        message: err?.message || 'Errore inatteso',
      },
      500
    )
  }
}
