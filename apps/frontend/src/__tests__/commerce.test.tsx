import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import CommercePage from '../app/commerce/page'

jest.mock('../lib/api', () => ({
  apiClient: {
    getProducts: async () => ({ products: [{ name: 'Product A', price: 1000, description: 'Desc' }], total: 1 }),
  },
}))

describe('Marketplace Page', () => {
  it('renders marketplace header and product card', async () => {
    render(<CommercePage />)
    expect(screen.getByText('Marketplace')).toBeInTheDocument()
    expect(await screen.findByText('Product A')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })
})

