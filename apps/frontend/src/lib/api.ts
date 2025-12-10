const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "")

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    phone: string
    role: string
    firstName?: string
    lastName?: string
  }
}

class ApiClient {
  private getStoredTokens() {
    if (typeof window === "undefined") return null
    try {
      const tokens = localStorage.getItem("auth_tokens")
      return tokens ? JSON.parse(tokens) : null
    } catch (error) {
      console.error("Failed to parse stored tokens:", error)
      return null
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const tokens = this.getStoredTokens()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers as Record<string, string>,
    }

    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`
    }

    const baseUrl = BACKEND_URL
    const url = `${baseUrl}${endpoint}`
    
    console.log(`Making API call to: ${url}`)
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error: ${response.status} - ${errorText}`)
        
        // Handle specific error cases
        if (response.status === 401) {
          // Clear invalid tokens
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_tokens")
          }
          throw new Error("Authentication failed. Please login again.")
        }
        
        if (response.status === 400) {
          throw new Error(`Bad request: ${errorText}`)
        }
        
        if (response.status === 404) {
          throw new Error("Resource not found")
        }
        
        throw new Error(`API request failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Network error. Please check your connection.")
    }
  }

  async register(
    email: string,
    phone: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    return this.request<AuthTokens>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ 
        email, 
        phone, 
        password, 
        firstName, 
        lastName,
      }),
    })
  }

  async login(email: string, password: string) {
    return this.request<AuthTokens>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async sendOtp(contact: string, type: "email" | "phone") {
    return this.request<{ message: string }>("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ contact, type }),
    })
  }

  async verifyOtp(contact: string, code: string) {
    return this.request<AuthTokens>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ contact, code }),
    })
  }

  async getCurrentUser() {
    return this.request<AuthTokens["user"]>("/api/users/me")
  }

  async getWallet() {
    return this.request<{ balance: number; currency: string; accountId: string }>("/api/wallet")
  }

  async getTransactions(limit = 10) {
    return this.request<{ transactions: Array<Record<string, unknown>>; total: number }>(`/api/transactions?limit=${limit}`)
  }

  async getProducts(category?: string) {
    const query = category ? `?category=${category}` : ""
    return this.request<{ products: Array<Record<string, unknown>>; total: number }>(`/api/marketplace/products${query}`)
  }

  // Subscription Marketplace APIs
  async getSubscriptionPlans() {
    return this.request<{ data: Array<Record<string, unknown>> }>("/api/subscriptions/plans").then(res => res.data)
  }

  async getSubscriptionPlan(id: string) {
    return this.request<{ data: Record<string, unknown> }>(`/api/subscriptions/plans/${id}`).then(res => res.data)
  }

  async subscribeToPlan(planId: string, paymentMethod: string = "paystack") {
    return this.request<{ data: Record<string, unknown> }>(`/api/subscriptions/subscribe/${planId}`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod }),
    }).then(res => res.data)
  }

  async getMySubscription() {
    return this.request<{ data: Record<string, unknown> }>("/api/subscriptions/my-subscription").then(res => res.data)
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request<{ data: Record<string, unknown> }>(`/api/subscriptions/cancel/${subscriptionId}`, {
      method: "POST",
    }).then(res => res.data)
  }

  async getSubscriptionMarketplace() {
    return this.request<{ data: Record<string, unknown> }>("/api/subscriptions/marketplace").then(res => res.data)
  }

  // Utility method for API health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>("/api/health")
  }

  // Telecom APIs
  async telecomAiPurchase(message: string, context?: Record<string, any>) {
    return this.request<{ success: boolean; message: string; provider?: string; transactionId?: string }>(
      "/api/telecom/ai-purchase",
      { method: "POST", body: JSON.stringify({ message, context }) }
    )
  }

  async telecomPurchase(request: {
    serviceType: 'airtime' | 'data' | 'electricity' | 'cable' | 'betting'
    network: 'mtn' | 'airtel' | 'glo' | '9mobile' | 'smile'
    amount: number
    phone?: string
    variation?: string
  }) {
    return this.request<{ success: boolean; message: string; provider?: string; transactionId?: string }>(
      "/api/telecom/purchase",
      { method: "POST", body: JSON.stringify(request) }
    )
  }

  async telecomPricing(serviceType: string, network: string, amount?: number) {
    const params = new URLSearchParams({ serviceType, network })
    if (amount) params.append('amount', String(amount))
    return this.request<any[]>(`/api/telecom/pricing?${params.toString()}`)
  }

  async telecomAvailability(serviceType: string, network: string) {
    const params = new URLSearchParams({ serviceType, network })
    return this.request<any>(`/api/telecom/availability?${params.toString()}`)
  }

  async telecomTransaction(transactionId: string, provider?: string) {
    const params = provider ? `?provider=${provider}` : ''
    return this.request<any>(`/api/telecom/transaction/${transactionId}${params}`)
  }

  async telecomHistory(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return this.request<any>(`/api/telecom/history?${params.toString()}`)
  }

  async verifyMeter(meterNumber: string, provider: string, type: 'prepaid' | 'postpaid') {
    return this.request<any>("/api/telecom/verify-meter", {
      method: "POST",
      body: JSON.stringify({ meterNumber, provider, type }),
    })
  }
  // NIN - Agent & Card APIs
  async ninOrdersByUser(userId: string) {
    return this.request<any>(`/api/nin/orders/${userId}`)
  }
  async ninStatsByUser(userId: string) {
    return this.request<any>(`/api/nin/stats/${userId}`)
  }
  async ninCardCreateOrder(payload: Record<string, unknown>) {
    return this.request<any>(`/api/nin-card/orders`, { method: "POST", body: JSON.stringify(payload) })
  }
  async ninCardUploadSlip(orderId: string, slipUrl: string) {
    return this.request<any>(`/api/nin-card/orders/${orderId}/upload-slip`, { method: "POST", body: JSON.stringify({ slipUrl }) })
  }
  async ninCardPay(orderId: string, method: string = "wallet") {
    return this.request<any>(`/api/nin-card/orders/${orderId}/pay`, { method: "POST", body: JSON.stringify({ method }) })
  }
  async ninCardTrack(orderId: string) {
    return this.request<any>(`/api/nin-card/orders/${orderId}/track`)
  }
  async ninCardPricing() {
    return this.request<any>(`/api/nin-card/pricing`)
  }
  async ninCardVerifyPayment(orderId: string, ref: string) {
    return this.request<any>(`/api/nin-card/orders/${orderId}/verify-payment`, { method: "POST", body: JSON.stringify({ ref }) })
  }
  async ninCardOrderDetails(orderId: string) {
    return this.request<any>(`/api/nin-card/orders/${orderId}/details`)
  }
  async ninCardListOrders() {
    return this.request<any>(`/api/nin-card/orders`)
  }

  // Wallet transfers
  async walletTransfer(to: string, amount: number, note?: string) {
    return this.request<any>(`/api/wallet/transfer`, { method: "POST", body: JSON.stringify({ to, amount, note }) })
  }
}

export const apiClient = new ApiClient()

export const api = {
  async get<T = any>(path: string) {
    const data = await apiClient.request<T>(path, { method: "GET" })
    return { data }
  },
  async post<T = any>(path: string, body?: Record<string, unknown>) {
    const data = await apiClient.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
    return { data }
  },
  async put<T = any>(path: string, body?: Record<string, unknown>) {
    const data = await apiClient.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
    return { data }
  },
  async delete<T = any>(path: string) {
    const data = await apiClient.request<T>(path, { method: "DELETE" })
    return { data }
  },
}
