
'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function WalletPage() {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<{ balance: number; currency: string; accountId: string } | null>(null)
  const [tx, setTx] = useState<{ transactions: any[]; total: number } | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const w = await apiClient.getWallet()
        const t = await apiClient.getTransactions(20)
        setWallet(w)
        setTx(t)
      } catch (e: any) {
        setError(e?.message || 'Failed to load wallet')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center bg-green-600/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <Wallet className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-300 text-sm font-medium">Universal Naira Wallet</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">Wallet</h1>
          <p className="text-gray-300 mt-2">Secure custody, instant transfers, clear history.</p>
        </div>

        {!isAuthenticated && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 mb-6">
            <div className="text-lg font-semibold mb-2">Please sign in</div>
            <div className="text-gray-300 text-sm mb-4">You need to be authenticated to view your wallet.</div>
            <a href="/login" className="inline-block px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">Sign In</a>
          </div>
        )}
        {loading && isAuthenticated && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
        {error && <div className="text-red-400">{error}</div>}

        {wallet && (
          <Card className="mb-6 border-green-500/30 bg-black/40">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-2xl">{wallet.currency} {wallet.balance.toLocaleString()}</CardTitle>
              <CardDescription>Account ID: {wallet.accountId}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex gap-3">
              <Button className="bg-green-600 hover:bg-green-700"><ArrowUpRight className="w-4 h-4" /> Send</Button>
              <Button variant="outline"><ArrowDownLeft className="w-4 h-4" /> Receive</Button>
            </CardContent>
          </Card>
        )}

        {tx && (
          <Card className="border-green-500/30 bg-black/40">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-xl">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <button
                onClick={() => {
                  try {
                    const rows = [['date','description','type','amount','status','reference']]
                    tx.transactions.forEach((item: any) => {
                      rows.push([
                        String(item.createdAt||item.timestamp||''),
                        String(item.description||''),
                        String(item.type||''),
                        String(item.amount||''),
                        String(item.status||''),
                        String(item.reference||item.id||'')
                      ])
                    })
                    const csv = rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'wallet-transactions.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {}
                }}
                className="px-3 py-2 rounded-lg bg-white/10 border border-green-500/30 hover:bg-white/20 text-xs"
              >
                Export CSV
              </button>
              {tx.transactions.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-gray-200">{item.description || item.type || 'Transaction'}</span>
                  <span className="text-sm">{item.amount ? String(item.amount) : ''}</span>
                </div>
              ))}
              {tx.transactions.length === 0 && (
                <div className="text-gray-400 text-sm">No transactions yet.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
