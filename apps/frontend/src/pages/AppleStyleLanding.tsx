import React, { useState, useEffect, useRef } from 'react';
import { Grand_Hotel } from 'next/font/google';
const grandHotel = Grand_Hotel({ subsets: ['latin'], weight: '400' });
import { ChevronDown, Shield, Users, Building, Wallet, ShoppingCart, Brain, Zap, TrendingUp, Phone, CreditCard, Award, CheckCircle, Play, Pause, ArrowRight, Menu, X, Globe, Store, Smartphone, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import DorceAILogo from '@/components/DorceAILogo';
import dynamic from 'next/dynamic';
import EnvatoBlend from '@/components/EnvatoBlend';

const CinematicBackground = dynamic(
  () => import('@/components/CinematicBackground'),
  { ssr: false }
);

interface FeaturedService {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
  features: string[];
}

interface NationalMetric {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
}

const featuredServices: FeaturedService[] = [
  {
    id: 'wallet',
    name: 'Wallet & Payments',
    tagline: 'Paystack-powered custody',
    description: 'Store funds securely with Paystack. Send, receive, and pay bills instantly.',
    icon: <Wallet className="w-8 h-8" />,
    color: 'bg-blue-600',
    route: '/wallet',
    features: ['Instant transfers', 'Bill payments', 'Paystack custody', 'Transaction history']
  },
  {
    id: 'vtu',
    name: 'Airtime & Data',
    tagline: 'VTU super-app',
    description: 'Buy airtime and data bundles for all networks. Coming with provider API keys.',
    icon: <Smartphone className="w-8 h-8" />,
    color: 'bg-purple-600',
    route: '/telecom',
    features: ['All networks', 'Instant top-up', 'Data bundles', 'Bulk SMS']
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    tagline: 'Naija vendors hub',
    description: 'Discover Nigerian vendors, list products, and track logistics seamlessly.',
    icon: <Store className="w-8 h-8" />,
    color: 'bg-orange-600',
    route: '/commerce',
    features: ['Vendor onboarding', 'Product listings', 'Order tracking', 'RFQ system']
  },
  {
    id: 'identity',
    name: 'NIN & CAC Agent',
    tagline: 'Agent-led services',
    description: 'Our agents help you enroll for NIN, order cards, and register your business.',
    icon: <FileText className="w-8 h-8" />,
    color: 'bg-green-600',
    route: '/nin',
    features: ['NIN enrollment', 'Card ordering', 'CAC registration', 'Status tracking']
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    tagline: 'Property & Construction',
    description: 'Nigeria Property Hub, development management, construction resources.',
    icon: <Building className="w-8 h-8" />,
    color: 'bg-emerald-600',
    route: '/real-estate',
    features: ['Property listings', 'Development projects', 'Construction resources', 'Market analytics']
  },
  {
    id: 'ai-services',
    name: 'AI & Neural',
    tagline: 'Africa-trained intelligence',
    description: 'Neural Core Engine, cultural AI assistant, fraud detection, predictive analytics.',
    icon: <Brain className="w-8 h-8" />,
    color: 'bg-indigo-600',
    route: '/ai',
    features: ['Cultural AI assistant', 'Fraud detection', 'Predictive analytics', 'Neural processing']
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    tagline: 'Enterprise-grade protection',
    description: 'Quantum encryption, zero-trust architecture, compliance monitoring.',
    icon: <Shield className="w-8 h-8" />,
    color: 'bg-red-600',
    route: '/security',
    features: ['Quantum encryption', 'Zero-trust security', 'Compliance monitoring', 'Threat detection']
  },
  {
    id: 'communication',
    name: 'Communication',
    tagline: 'Connect with Naija',
    description: 'Chat platform, bulk SMS, AI assistant, group communication features.',
    icon: <Phone className="w-8 h-8" />,
    color: 'bg-teal-600',
    route: '/chat',
    features: ['Chat platform', 'Bulk SMS', 'AI assistant', 'Group features']
  }
];

const nationalMetrics: NationalMetric[] = [
  { label: 'Citizens Served', value: 218000000, suffix: '', icon: <Users className="w-6 h-6" /> },
  { label: 'Daily Transactions', value: 1250000000, suffix: '', icon: <TrendingUp className="w-6 h-6" /> },
  { label: 'GDP Contribution', value: 45, suffix: 'T', icon: <Award className="w-6 h-6" /> },
  { label: 'Active Users', value: 125000000, suffix: '', icon: <CheckCircle className="w-6 h-6" /> }
];

export const AppleStyleLanding: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState(nationalMetrics.map(m => ({ ...m, displayValue: m.value })));
  const [heroContentVisible, setHeroContentVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const rotatingLines = [
    "Access government services in seconds",
    "Send money instantly",
    "Pay digital subscriptions",
    "Showcase your store with our AI engine",
    "Shop nationwide securely",
    "Built for 218 million Nigerians"
  ];
  const [currentLine, setCurrentLine] = useState(0);
  const [conceptRotation, setConceptRotation] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    setTimeout(() => setHeroContentVisible(true), 300);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((i) => (i + 1) % rotatingLines.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const r = setInterval(() => {
      setConceptRotation((v) => (v + 1) % 360);
    }, 50);
    return () => clearInterval(r);
  }, []);

  useEffect(() => {
    const animateMetrics = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setAnimatedMetrics(prev => prev.map((metric) => ({
          ...metric,
          displayValue: Math.floor(metric.value * easeOutQuart)
        })));
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateMetrics();
        }
      },
      { threshold: 0.5 }
    );

    const metricsElement = document.getElementById('national-metrics');
    if (metricsElement) {
      observer.observe(metricsElement);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiClient.healthCheck();
        setApiHealthy(res?.status === 'ok' || !!res?.timestamp);
      } catch {
        setApiHealthy(false);
      }
    };
    check();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const ConceptShowcase: React.FC<{ rotation: number }> = ({ rotation }) => {
    return (
      <div className="relative w-full h-60 sm:h-72 md:h-80 lg:h-[420px] max-w-xl rounded-3xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-xl">
        <EnvatoBlend imageUrl={process.env.NEXT_PUBLIC_ENVATO_IMAGE_URL} rotation={rotation} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72">
            {/** Orbiting chips around the center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="rounded-2xl px-3 py-2 bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg"
                style={{ transform: `rotate(${rotation}deg) translate(116px) rotate(-${rotation}deg)` }}
              >
                <div className="flex items-center gap-2"><Wallet className="w-6 h-6" /><span className="text-xs">Wallet</span></div>
              </div>
              <div
                className="rounded-2xl px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg"
                style={{ transform: `rotate(${rotation + 90}deg) translate(116px) rotate(-${rotation + 90}deg)` }}
              >
                <div className="flex items-center gap-2"><Store className="w-6 h-6" /><span className="text-xs">Marketplace</span></div>
              </div>
              <div
                className="rounded-2xl px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg"
                style={{ transform: `rotate(${rotation + 180}deg) translate(116px) rotate(-${rotation + 180}deg)` }}
              >
                <div className="flex items-center gap-2"><FileText className="w-6 h-6" /><span className="text-xs">CAC/NIN</span></div>
              </div>
              <div
                className="rounded-2xl px-3 py-2 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg"
                style={{ transform: `rotate(${rotation + 270}deg) translate(116px) rotate(-${rotation + 270}deg)` }}
              >
                <div className="flex items-center gap-2"><Smartphone className="w-6 h-6" /><span className="text-xs">Telecom</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <CinematicBackground />
      
      <nav className="fixed top-0 w-full z-50 bg-black bg-opacity-80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <div className="mr-3">
                <DorceAILogo size="small" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">DORCE</span>
                <span className="text-xs text-gray-400 hidden sm:block">Connecting businesses & individuals across Nigeria</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#featured" className="text-gray-300 hover:text-white transition-colors">Featured</a>
              <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
              <a href="#metrics" className="text-gray-300 hover:text-white transition-colors">Impact</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
              <Link href="/register/wizard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">Get Started</Link>
            </div>

            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black bg-opacity-95 backdrop-blur-md border-t border-gray-800">
            <div className="px-4 py-4 space-y-3">
              <a href="#featured" className="block text-gray-300 hover:text-white transition-colors">Featured</a>
              <a href="#security" className="block text-gray-300 hover:text-white transition-colors">Security</a>
              <a href="#metrics" className="block text-gray-300 hover:text-white transition-colors">Impact</a>
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <Link href="/login" className="block text-gray-300 hover:text-white transition-colors w-full text-left">Sign In</Link>
                <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors w-full text-center">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section ref={heroRef} className="relative z-30 min-h-screen flex items-center justify-center overflow-hidden pt-28 sm:pt-32 md:pt-44">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900">
          <div className="absolute inset-0 bg-black bg-opacity-30" />
          
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => {
              const sizes = ['w-8 h-8','w-10 h-10','w-12 h-12','w-14 h-14'];
              const sizeClass = sizes[i % sizes.length];
              return (
                <div
                  key={i}
                  className="absolute opacity-10 animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                >
                  <div className={`${sizeClass} border border-green-400/60 rounded-lg`} />
                </div>
              );
            })}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-5 animate-pulse" 
               style={{ animationDuration: '4s' }} />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="text-center md:text-left">
              <div className={`mb-8 transition-all duration-1000 ${heroContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center bg-green-600 bg-opacity-20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">Agent & Partner Network</span>
                </div>
                
                <h1 className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-green-200 to-yellow-200 bg-clip-text text-transparent transition-all duration-1200 delay-200 ${heroContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  One Platform.
                  <br />
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Intelligent.
                  </span>
                  <br />
                  Infinite Possibilities.
                </h1>
                
              <div className={`transition-all duration-700 ${heroContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="text-3xl md:text-4xl font-semibold max-w-4xl mx-auto md:mx-0">
                  <span className={`${grandHotel.className} bg-gradient-to-r from-green-300 via-blue-300 to-yellow-300 bg-clip-text text-transparent tracking-wide`}>
                    {rotatingLines[currentLine]}
                  </span>
                </div>
              </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-3 justify-center md:justify-start items-stretch mb-10 sm:mb-12 transition-all duration-1200 delay-600 ${heroContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Link href="/cac-registration" className="bg-green-600 hover:bg-green-700 text-white px-7 py-4 rounded-2xl text-base font-semibold transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/25 ring-1 ring-white/10 hover:ring-white/20 min-w-[240px] justify-center">
                  <Briefcase className="w-5 h-5" />
                  Register Your Business
                </Link>
                <Link href="/plan-collaborate" className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-2xl text-base font-semibold transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/25 ring-1 ring-white/10 hover:ring-white/20 min-w-[240px] justify-center">
                  Plan & Collaborate
                </Link>
                <Link href="/nin/enroll" className="bg-green-600 hover:bg-green-700 text-white px-7 py-4 rounded-2xl text-base font-semibold transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/25 ring-1 ring-white/10 hover:ring-white/20 min-w-[240px] justify-center">
                  <Shield className="w-5 h-5" />
                  Get Your National ID
                </Link>
                <a href="#featured" className="border border-gray-600 hover:border-gray-500 text-white px-7 py-4 rounded-2xl text-base font-semibold transition-all flex items-center gap-2 backdrop-blur-sm hover:bg-white hover:bg-opacity-10 ring-1 ring-white/10 hover:ring-white/20 min-w-[240px] justify-center">
                  Explore Services
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>

            {false && (
              <div className="flex flex-col items-center md:items-start animate-bounce">
                <span className="text-gray-400 text-sm mb-2">Scroll to explore</span>
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </div>
            )}
            </div>
            <div className="flex justify-center md:justify-end">
              <ConceptShowcase rotation={conceptRotation} />
            </div>
          </div>
        </div>
      </section>

      

      

      <section id="security" className="py-20 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`
              }}
            />
          ))}
          
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute border-l border-blue-400 opacity-20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  height: `${20 + Math.random() * 40}%`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-green-600 bg-opacity-20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-blue-400 text-sm font-medium">Enterprise-Grade Security</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Bank-level Protection
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for 218 million Nigerians with AES-256 encryption and 99.99% uptime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black bg-opacity-30 backdrop-blur-md rounded-2xl p-8 border border-blue-500 border-opacity-30 hover:border-opacity-60 transition-all duration-300 group transform hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-500/25">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-3 mb-6 inline-flex group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors duration-300">Fraud Shield</h3>
              <p className="text-gray-300 mb-6 group-hover:text-white transition-colors duration-300">AI-powered fraud detection trained on African transaction patterns</p>
              <div className="text-blue-400 text-3xl font-bold group-hover:text-blue-300 transition-colors duration-300">99.99%</div>
              <div className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors duration-300">Detection Accuracy</div>
            </div>

            <div className="bg-black bg-opacity-30 backdrop-blur-md rounded-2xl p-8 border border-green-500 border-opacity-30 hover:border-opacity-60 transition-all duration-300 group transform hover:-translate-y-2 hover:shadow-lg hover:shadow-green-500/25">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-3 mb-6 inline-flex group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-green-400 transition-colors duration-300">AES-256 Encryption</h3>
              <p className="text-gray-300 mb-6 group-hover:text-white transition-colors duration-300">Military-grade encryption for all data and transactions</p>
              <div className="text-green-400 text-3xl font-bold group-hover:text-green-300 transition-colors duration-300">256-bit</div>
              <div className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors duration-300">Encryption Standard</div>
            </div>

            <div className="bg-black bg-opacity-30 backdrop-blur-md rounded-2xl p-8 border border-purple-500 border-opacity-30 hover:border-opacity-60 transition-all duration-300 group transform hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/25">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-3 mb-6 inline-flex group-hover:scale-110 transition-transform duration-300">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors duration-300">Partner Verified</h3>
              <p className="text-gray-300 mb-6 group-hover:text-white transition-colors duration-300">Vetted by leading Nigerian fintech and telecom partners</p>
              <div className="text-purple-400 text-3xl font-bold group-hover:text-purple-300 transition-colors duration-300">A+</div>
              <div className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors duration-300">Security Rating</div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-2xl p-8 border border-gray-700 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2" />
                <span className="text-green-400 font-semibold">Real-time Threat Monitoring Active</span>
              </div>
              <p className="text-gray-300 text-sm">
                24/7 security operations center • Zero-trust architecture • Partner-grade compliance
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="featured" className="py-16 sm:py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Featured Services
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The most useful services to start now — Wallet, VTU, Marketplace, and NIN/CAC agent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {featuredServices.map((service, index) => (
              <Link key={service.id} href={service.route}>
                <div 
                  className="rounded-2xl p-[1px] bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 hover:from-green-500/40 hover:via-blue-500/40 hover:to-purple-500/40 transition-all duration-300 group transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: 'fadeInUp 0.8s ease-out forwards'
                  }}
                >
                  <div className="rounded-2xl bg-gray-900 p-8 border border-gray-800">
                    <div className="flex items-center mb-6">
                      <div className="mr-4 rounded-xl p-3 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white group-hover:scale-110 transition-transform duration-300">
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-green-400 transition-colors duration-300">{service.name}</h3>
                        <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">{service.tagline}</p>
                      </div>
                    </div>
                  
                    <div className="space-y-3 mb-6">
                      {service.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex} 
                          className="flex items-center text-sm text-gray-300 group-hover:text-white transition-colors duration-300"
                          style={{
                            animationDelay: `${featureIndex * 50}ms`,
                            animation: 'fadeInLeft 0.5s ease-out forwards'
                          }}
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 group-hover:scale-105 transition-transform duration-300`}>
                      Available Now
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 bg-opacity-20 rounded-2xl p-6 border border-green-500 border-opacity-30 max-w-md mx-auto">
              <div className="text-4xl font-bold text-green-400 mb-2">8</div>
              <div className="text-gray-300 text-sm">Core Service Categories</div>
              <div className="text-gray-500 text-xs mt-1">Agent & Partner Network</div>
            </div>
          </div>
        </div>
      </section>

      <section id="metrics" className="py-16 sm:py-20 bg-gradient-to-r from-green-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-yellow-400 rounded-full animate-pulse opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              National Impact
            </h2>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Join 125 million Nigerians already using Dorce.ai to transform their daily lives.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {animatedMetrics.map((metric, index) => (
              <div 
                key={index} 
                className="text-center group hover:scale-105 transition-transform duration-300"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                    {metric.icon}
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                  {formatNumber(metric.displayValue)}{metric.suffix}
                </div>
                <div className="text-gray-200 text-sm uppercase tracking-wide group-hover:text-white transition-colors duration-300">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 bg-opacity-20 rounded-full px-6 py-3 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
              <span className="text-white font-medium">Real-time national data updated every 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-t border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
            Your Nigeria.
            <br />
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Any device. Anywhere.
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Three simple steps to access everything Nigeria has to offer. Start your journey today.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-green-400 transition-colors duration-300">Verify Identity</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">Secure NIN verification in seconds</p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors duration-300">Secure Wallet</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">Universal Naira wallet setup</p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-400 transition-colors duration-300">Access Everything</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">All featured services at your fingertips</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register/wizard" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/25">
              <Phone className="w-5 h-5" />
              Get Started Now
            </Link>
            <button className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 backdrop-blur-sm hover:bg-white hover:bg-opacity-10">
              <CreditCard className="w-5 h-5" />
              USSD Access *347#
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Works on any device • No internet required • Available in 5 languages
            </p>
            <div className="flex justify-center items-center space-x-6 text-xs text-gray-500">
              <span>🇳🇬 English</span>
              <span>🇳🇬 Pidgin</span>
              <span>🇳🇬 Hausa</span>
              <span>🇳🇬 Yoruba</span>
              <span>🇳🇬 Igbo</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 border-t border-gray-800 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="mr-3">
                  <DorceAILogo size="small" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">DORCE</span>
                  <span className="text-xs text-gray-400">Connecting businesses & individuals across Nigeria</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Nigeria's Agent & Partner Network - Unifying 218 million citizens through technology. 
                Access government services, financial tools, and marketplace solutions in one secure platform.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center">🇳🇬 Made in Nigeria</span>
                <span>•</span>
                <span>Agent & Partner Network</span>
                <span>•</span>
                <span>NDPR Compliant</span>
              </div>
              <div className="flex space-x-4">
                <div className="bg-green-600 bg-opacity-20 rounded-lg p-2">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <div className="bg-blue-600 bg-opacity-20 rounded-lg p-2">
                  <Award className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-purple-600 bg-opacity-20 rounded-lg p-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Services</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/wallet" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Wallet & Payments</Link></li>
                <li><Link href="/telecom" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Airtime & Data</Link></li>
                <li><Link href="/commerce" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Marketplace</Link></li>
                <li><Link href="/nin" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />NIN & CAC Agent</Link></li>
                <li><Link href="/real-estate" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Real Estate</Link></li>
                <li><Link href="/ai" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />AI & Neural</Link></li>
                <li><Link href="/security" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Security</Link></li>
                <li><Link href="/chat" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Communication</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Help Center</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Contact Us</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Agent Network</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2" />Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-500 text-sm">
                &copy; 2024 Dorce.ai. All rights reserved. | Agent & Partner Network for Nigeria
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <div className={`w-2 h-2 rounded-full ${apiHealthy === null ? 'bg-gray-500 animate-pulse' : apiHealthy ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
                <span>{apiHealthy === null ? 'Checking API...' : apiHealthy ? 'All systems operational' : 'API offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppleStyleLanding;
