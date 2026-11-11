import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GrowTree } from './GrowTree'

describe('GrowTree', () => {
  it.each([
    [0, 'たね'],
    [1, 'め'],
    [2, 'わかぎ'],
    [3, 'き'],
    [4, 'みのなるき'],
  ])('段階 %i は「%s」', (stage, name) => {
    render(<GrowTree stage={stage} />)
    expect(screen.getByRole('img', { name: `そだてている き: ${name}` })).toBeInTheDocument()
  })

  it('範囲外の段階は、いちばん近い段階になる', () => {
    render(<GrowTree stage={99} />)
    expect(screen.getByRole('img', { name: /みのなるき/ })).toBeInTheDocument()
  })
})
