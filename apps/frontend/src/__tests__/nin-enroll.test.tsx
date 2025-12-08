import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import NinEnrollPage from '../app/nin/enroll/page'

jest.mock('../lib/api', () => ({
  api: {
    post: async () => ({ data: { id: 'ENR-1' } }),
    put: async () => ({ data: {} }),
    get: async () => ({ data: { status: 'created' } }),
  },
}))

describe('NIN Enrollment Page', () => {
  it('renders header', () => {
    render(<NinEnrollPage />)
    expect(screen.getByText('NIN Enrollment')).toBeInTheDocument()
  })
})

