'use client'
import React, { useEffect, useState } from 'react'

type Err = { id: string; type: 'error' | 'rejection'; message: string; stack?: string }

function useErrorCapture() {
  const [errors, setErrors] = useState<Err[]>([])

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = typeof e.message === 'string' ? e.message : String(e)
      const stack = (e.error && (e.error as any).stack) || undefined
      const err: Err = { id: `${Date.now()}-error`, type: 'error', message: msg, stack }
      console.error('window.error', msg, stack)
      setErrors(prev => [...prev, err])
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason
      const msg = typeof reason === 'string' ? reason : (reason && reason.message) || String(reason)
      const stack = (reason && reason.stack) || undefined
      const err: Err = { id: `${Date.now()}-rejection`, type: 'rejection', message: msg, stack }
      console.error('unhandledrejection', msg, stack)
      setErrors(prev => [...prev, err])
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return errors
}

export function ErrorOverlay() {
  const errors = useErrorCapture()
  const [visible, setVisible] = useState<boolean>(() => {
    const fromEnv = process.env.NEXT_PUBLIC_DEBUG === '1'
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined
    const fromQuery = params ? params.get('debug') === '1' : false
    return fromEnv || fromQuery
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === '1') setVisible(true)
  }, [])

  if (!visible || errors.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, maxWidth: 420, background: 'rgba(17,24,39,0.95)', color: '#fff', border: '1px solid #374151', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #374151' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Client Errors</div>
        <button onClick={() => setVisible(false)} style={{ background: 'transparent', border: 0, color: '#9CA3AF', cursor: 'pointer', fontSize: 14 }}>Hide</button>
      </div>
      <div style={{ maxHeight: 260, overflow: 'auto', padding: 12 }}>
        {errors.map(err => (
          <div key={err.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#93C5FD' }}>{err.type}</div>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>{err.message}</div>
            {err.stack && (
              <pre style={{ marginTop: 8, fontSize: 11, whiteSpace: 'pre-wrap', color: '#D1D5DB' }}>{err.stack}</pre>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #374151', fontSize: 11, color: '#9CA3AF' }}>Add ?debug=1 to the URL or set NEXT_PUBLIC_DEBUG=1 to show</div>
    </div>
  )
}