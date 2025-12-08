import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TelecomPage from '../app/telecom/page'

describe('Telecom Page', () => {
  it('renders hero and purchase CTA', () => {
    render(<TelecomPage />)
    expect(screen.getByText('Telecom Services')).toBeInTheDocument()
    expect(screen.getByText('Purchase')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /purchase/i })).toBeInTheDocument()
  })
})

