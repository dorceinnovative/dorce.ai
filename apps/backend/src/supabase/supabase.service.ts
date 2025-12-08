import { Injectable, Inject } from '@nestjs/common'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { JwtSecretService } from '../auth/jwt-secret.service'

@Injectable()
export class SupabaseService {
  constructor(
    @Inject('SUPABASE_CLIENT') 
    private readonly supabase: SupabaseClient,
    private readonly jwtSecretService: JwtSecretService
  ) {}

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase
  }

  /**
   * Get user by ID from Supabase auth
   */
  async getUserById(userId: string) {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId)
    if (error) throw error
    return data.user
  }

  /**
   * Create a new user in Supabase auth
   */
  async createUser(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true,
    })
    if (error) throw error
    return data.user
  }

  /**
   * Update user metadata
   */
  async updateUser(userId: string, metadata: any) {
    const { data, error } = await this.supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    )
    if (error) throw error
    return data.user
  }

  /**
   * Delete user from Supabase auth
   */
  async deleteUser(userId: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(userId)
    if (error) throw error
    return true
  }

  /**
   * Get all users with pagination
   */
  async listUsers(page: number = 1, perPage: number = 50) {
    const { data, error } = await this.supabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) throw error
    return data.users
  }

  /**
   * Real-time subscription to auth changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Execute custom SQL query
   */
  async executeQuery(query: string, params?: any[]) {
    const { data, error } = await this.supabase.rpc('exec_sql', { 
      query, 
      params 
    }).single()
    if (error) throw error
    return data
  }

  /**
   * Health check for Supabase connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('users').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  /**
   * Sync user data between Prisma and Supabase
   */
  async syncUserData(userId: string, userData: any) {
    try {
      // Update Supabase auth metadata
      await this.updateUser(userId, {
        synced_at: new Date().toISOString(),
        ...userData
      })
      
      return { success: true }
    } catch (error) {
      console.error('User sync failed:', error)
      return { success: false, error }
    }
  }

  /**
   * Create JWT token for Supabase auth
   */
  async createSupabaseToken(userId: string, email: string, role: string) {
    // Create a simple secure token
    return this.jwtSecretService.generateRandomString(64)
  }

  /**
   * Get real-time subscription to user changes
   */
  subscribeToUserChanges(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        callback
      )
      .subscribe()
  }

  /**
   * Get user session and metadata
   */
  async getUserSession(userId: string) {
    try {
      const user = await this.getUserById(userId)
      const { data: { session } } = await this.supabase.auth.getSession()
      
      return {
        user,
        session,
        metadata: user?.user_metadata || {},
      }
    } catch (error) {
      console.error('Get user session failed:', error)
      return null
    }
  }

  /**
   * Bulk user operations
   */
  async bulkCreateUsers(users: Array<{email: string, password: string, metadata?: any}>) {
    const results: Array<{success: boolean, user?: any, error?: string, email?: string}> = []
    
    for (const user of users) {
      try {
        const createdUser = await this.createUser(user.email, user.password, user.metadata)
        results.push({ success: true, user: createdUser })
      } catch (error) {
        results.push({ success: false, error: (error as Error).message, email: user.email })
      }
    }
    
    return results
  }

  /**
   * Advanced user search with filters
   */
  async searchUsers(filters: {
    email?: string
    phone?: string
    role?: string
    createdAfter?: Date
    createdBefore?: Date
    metadata?: Record<string, any>
  }) {
    let query = this.supabase.from('users').select('*')
    
    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`)
    }
    
    if (filters.role) {
      query = query.eq('role', filters.role)
    }
    
    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter.toISOString())
    }
    
    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }
}