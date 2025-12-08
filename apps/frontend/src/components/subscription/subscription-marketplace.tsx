'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  isActive: boolean;
  trialDays?: number;
  setupFee?: number;
}

interface SubscriptionMarketplaceProps {
  onClose?: () => void;
}

export function SubscriptionMarketplace({ onClose }: SubscriptionMarketplaceProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSubscriptionPlans();
      const normalized = (response as any[]).map((plan) => ({
        id: String(plan.id ?? ''),
        name: String(plan.name ?? ''),
        description: String(plan.description ?? ''),
        price: Number(plan.price ?? 0),
        currency: String(plan.currency ?? 'NGN'),
        billingCycle: (plan.billingCycle ?? 'monthly') as 'monthly' | 'quarterly' | 'yearly',
        features: Array.isArray(plan.features) ? plan.features : [],
        isActive: Boolean(plan.isActive ?? true),
        trialDays: plan.trialDays ? Number(plan.trialDays) : undefined,
        setupFee: plan.setupFee ? Number(plan.setupFee) : undefined,
      })) as SubscriptionPlan[];
      setPlans(normalized);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/subscriptions');
      return;
    }

    setSelectedPlan(plan);
    setSubscribing(true);

    try {
      await apiClient.subscribeToPlan(plan.id, 'paystack');
      
      // Show success message
      alert(`Successfully subscribed to ${plan.name}!`);
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('premium')) return <Crown className="h-5 w-5" />;
    if (name.includes('pro')) return <Star className="h-5 w-5" />;
    if (name.includes('enterprise')) return <Shield className="h-5 w-5" />;
    if (name.includes('growth')) return <TrendingUp className="h-5 w-5" />;
    return <Zap className="h-5 w-5" />;
  };

  const formatPrice = (price: number, currency: string, billingCycle: string) => {
    const currencySymbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    const cycleText = billingCycle === 'monthly' ? 'month' : billingCycle === 'quarterly' ? 'quarter' : 'year';
    return `${currencySymbol}${price.toLocaleString()}/${cycleText}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="subscription-marketplace">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Subscription Marketplace</h2>
        <p className="text-blue-200">
          Choose a subscription plan to unlock premium features and services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="subscription-plan-card">
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getPlanIcon(plan.name)}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                {plan.trialDays && plan.trialDays > 0 && (
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    {plan.trialDays} days free
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-4">
                <div className="text-3xl font-bold text-white">
                  {formatPrice(plan.price, plan.currency, plan.billingCycle)}
                </div>
                {plan.setupFee && plan.setupFee > 0 && (
                  <div className="text-sm text-gray-400">
                    + {plan.currency === 'NGN' ? '₦' : plan.currency === 'USD' ? '$' : plan.currency}{plan.setupFee.toLocaleString()} setup fee
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white">Features:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={subscribing && selectedPlan?.id === plan.id}
                className="w-full"
              >
                {subscribing && selectedPlan?.id === plan.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subscribing...
                  </>
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-400">No subscription plans available at the moment.</p>
        </div>
      )}
    </div>
  );
}