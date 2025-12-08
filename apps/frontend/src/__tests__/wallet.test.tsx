import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import WalletPage from '../app/wallet/page'

jest.mock('../lib/api', () => ({
  apiClient: {
    getWallet: async () => ({ balance: 10000, currency: '₦', accountId: 'ACC-123' }),
    getTransactions: async () => ({ transactions: [], total: 0 }),
  },
}))

describe('Wallet Page', () => {
  it('renders wallet header and actions', async () => {
    render(<WalletPage />)
    expect(await screen.findByText('Universal Naira Wallet')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /send/i })).toBeInTheDocument()
  })
})

