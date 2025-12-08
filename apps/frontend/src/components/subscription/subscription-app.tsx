'use client';

import { useState, useEffect } from 'react';
import { SubscriptionMarketplace } from '../subscription/subscription-marketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Calendar, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SubscriptionAppProps {
  onClose?: () => void;
}

export function SubscriptionApp({ onClose }: SubscriptionAppProps) {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-subscription'>('marketplace');
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && activeTab === 'my-subscription') {
      loadUserSubscription();
    }
  }, [isAuthenticated, activeTab]);

  const loadUserSubscription = async () => {
    try {
      setLoading(true);
      const subscription = await apiClient.getMySubscription();
      setUserSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setUserSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trial':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number, currency: string, billingCycle: string) => {
    const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    const cycleText = billingCycle === 'monthly' ? 'month' : billingCycle === 'quarterly' ? 'quarter' : 'year';
    return `${currencySymbol}${price.toLocaleString()}/${cycleText}`;
  };

  return (
    <div className="subscription-app h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'marketplace'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('my-subscription')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'my-subscription'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Subscription
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'marketplace' && (
          <SubscriptionMarketplace onClose={onClose} />
        )}

        {activeTab === 'my-subscription' && (
          <div className="my-subscription">
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Please sign in to view your subscription</p>
                <Button onClick={() => window.location.href = '/login'}>
                  Sign In
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : userSubscription ? (
              <div className="space-y-6">
                {/* Current Subscription Card */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Current Subscription</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(userSubscription.status)}`}></div>
                        <Badge variant="outline" className="text-white border-white">
                          {userSubscription.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">
                          {formatPrice(
                            userSubscription.plan.price,
                            userSubscription.plan.currency,
                            userSubscription.plan.billingCycle
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">
                          Started: {formatDate(userSubscription.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">
                          Next billing: {formatDate(userSubscription.nextBillingDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">
                          Auto-renew: {userSubscription.autoRenew ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>

                    {userSubscription.status === 'active' && (
                      <div className="pt-4 border-t border-slate-600">
                        <Button
                          variant="outline"
                          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel your subscription?')) {
                              try {
                                await apiClient.cancelSubscription(userSubscription.id);
                                await loadUserSubscription();
                                alert('Subscription cancelled successfully');
                              } catch (error) {
                                alert('Failed to cancel subscription');
                              }
                            }
                          }}
                        >
                          Cancel Subscription
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Plan Features */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Plan Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userSubscription.plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You don't have an active subscription</p>
                <Button onClick={() => setActiveTab('marketplace')}>
                  Browse Plans
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}