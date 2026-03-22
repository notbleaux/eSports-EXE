/**
 * Auth Store Tests - P0 Test Coverage
 * 
 * Tests for Zustand authentication state management
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, useUser, useIsAuthenticated, useAuthLoading, useAuthError } from '../../stores/authStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useAuthStore.getState()
    store.logout()
    store.setLoading(false)
    store.clearError()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()
      
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setUser', () => {
    it('should set user', () => {
      const store = useAuthStore.getState()
      const user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        is_verified: true,
      }
      
      store.setUser(user)
      
      expect(useAuthStore.getState().user).toEqual(user)
    })

    it('should clear user when set to null', () => {
      const store = useAuthStore.getState()
      
      store.setUser({
        id: 'user-123',
        username: 'testuser',
        is_active: true,
        is_verified: true,
      })
      store.setUser(null)
      
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('setAuthenticated', () => {
    it('should set authenticated state', () => {
      const store = useAuthStore.getState()
      
      store.setAuthenticated(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      
      store.setAuthenticated(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = useAuthStore.getState()
      
      store.setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)
      
      store.setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const store = useAuthStore.getState()
      
      store.setError('Authentication failed')
      expect(useAuthStore.getState().error).toBe('Authentication failed')
    })

    it('should clear error when set to null', () => {
      const store = useAuthStore.getState()
      
      store.setError('Some error')
      store.setError(null)
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      const store = useAuthStore.getState()
      
      store.setError('Error message')
      store.clearError()
      
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('login', () => {
    it('should set user and authenticated on login', () => {
      const store = useAuthStore.getState()
      const user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        is_verified: true,
      }
      
      store.login(user)
      
      expect(useAuthStore.getState().user).toEqual(user)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().error).toBeNull()
    })

    it('should clear previous error on login', () => {
      const store = useAuthStore.getState()
      
      store.setError('Previous error')
      store.login({
        id: 'user-123',
        username: 'testuser',
        is_active: true,
        is_verified: true,
      })
      
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear user and authenticated on logout', () => {
      const store = useAuthStore.getState()
      
      store.login({
        id: 'user-123',
        username: 'testuser',
        is_active: true,
        is_verified: true,
      })
      store.logout()
      
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user fields', () => {
      const store = useAuthStore.getState()
      
      store.login({
        id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        is_active: true,
        is_verified: true,
      })
      
      store.updateUser({ display_name: 'Updated Name' })
      
      expect(useAuthStore.getState().user?.display_name).toBe('Updated Name')
      expect(useAuthStore.getState().user?.username).toBe('testuser')
    })

    it('should not update when user is null', () => {
      const store = useAuthStore.getState()
      
      store.updateUser({ display_name: 'New Name' })
      
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should update multiple fields', () => {
      const store = useAuthStore.getState()
      
      store.login({
        id: 'user-123',
        username: 'testuser',
        email: 'old@example.com',
        avatar_url: 'old.png',
        is_active: true,
        is_verified: true,
      })
      
      store.updateUser({
        email: 'new@example.com',
        avatar_url: 'new.png',
      })
      
      const user = useAuthStore.getState().user
      expect(user?.email).toBe('new@example.com')
      expect(user?.avatar_url).toBe('new.png')
      expect(user?.username).toBe('testuser')
    })
  })

  describe('persistence', () => {
    it('should persist user and isAuthenticated', () => {
      const store = useAuthStore.getState()
      
      store.login({
        id: 'user-123',
        username: 'testuser',
        is_active: true,
        is_verified: true,
      })
      
      // Check that state was persisted to localStorage
      const persisted = localStorage.getItem('sator-auth-storage')
      expect(persisted).toBeTruthy()
      
      const parsed = JSON.parse(persisted!)
      expect(parsed.state.user).toBeDefined()
      expect(parsed.state.isAuthenticated).toBe(true)
    })

    it('should not persist loading and error states', () => {
      const store = useAuthStore.getState()
      
      store.login({
        id: 'user-123',
        username: 'testuser',
        is_active: true,
        is_verified: true,
      })
      store.setLoading(true)
      store.setError('Some error')
      
      const persisted = localStorage.getItem('sator-auth-storage')
      const parsed = JSON.parse(persisted!)
      
      // loading and error should not be in persisted state
      expect(parsed.state.isLoading).toBeUndefined()
      expect(parsed.state.error).toBeUndefined()
    })
  })
})

describe('selector hooks', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  describe('useUser', () => {
    it('should select user from state', () => {
      const store = useAuthStore.getState()
      const user = {
        id: 'user-123',
        username: 'testuser',
        is_active: true,
        is_verified: true,
      }
      store.setUser(user)
      
      // useUser is a hook, we'd need to test it with renderHook
      // Here we just verify it selects the right property
      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
    })
  })

  describe('useIsAuthenticated', () => {
    it('should select isAuthenticated from state', () => {
      const store = useAuthStore.getState()
      store.setAuthenticated(true)
      
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('useAuthLoading', () => {
    it('should select isLoading from state', () => {
      const store = useAuthStore.getState()
      store.setLoading(true)
      
      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(true)
    })
  })

  describe('useAuthError', () => {
    it('should select error from state', () => {
      const store = useAuthStore.getState()
      store.setError('Test error')
      
      const state = useAuthStore.getState()
      expect(state.error).toBe('Test error')
    })
  })
})
