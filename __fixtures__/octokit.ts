import { jest } from '@jest/globals'

export const graphql = jest.fn()
export const paginate = jest.fn()
export const rest = {
  issues: {
    addLabels: jest.fn(),
    createLabel: jest.fn(),
    get: jest.fn(),
    getLabel: jest.fn(),
    removeLabel: jest.fn()
  }
}
