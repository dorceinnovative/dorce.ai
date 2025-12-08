import React from 'react';
import { motion } from 'framer-motion';

interface NigerianCulturalDesignProps {
  children: React.ReactNode;
  pattern?: 'ankara' | 'geometric' | 'flag' | 'subtle';
  intensity?: 'low' | 'medium' | 'high';
}

export const NigerianCulturalDesign: React.FC<NigerianCulturalDesignProps> = ({ 
  children, 
  pattern = 'subtle', 
  intensity = 'medium' 
}) => {
  const getPatternClass = () => {
    const intensityMap = {
      low: 'opacity-20',
      medium: 'opacity-40',
      high: 'opacity-60'
    };

    const patternMap = {
      ankara: 'ankara-pattern',
      geometric: 'ankara-geometric',
      flag: 'nigeria-flag-gradient',
      subtle: 'ankara-pattern-subtle'
    };

    return `${patternMap[pattern]} ${intensityMap[intensity]}`;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Cultural Pattern Background */}
      <div className={`absolute inset-0 ${getPatternClass()} pointer-events-none`} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface NigerianButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'cultural';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const NigerianButton: React.FC<NigerianButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'naija-button',
    secondary: 'naija-button-secondary',
    cultural: 'bg-gradient-to-r from-nigeria-green to-nigeria-gold text-white font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-lg font-semibold transition-all duration-300
        relative overflow-hidden
      `}
    >
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        </div>
      )}
      <span className={loading ? 'opacity-50' : ''}>{children}</span>
    </motion.button>
  );
};

interface NigerianCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'cultural' | 'glass';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

export const NigerianCard: React.FC<NigerianCardProps> = ({
  children,
  variant = 'default',
  elevation = 'md',
  interactive = false,
  onClick
}) => {
  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const variantClasses = {
    default: 'naija-card',
    cultural: 'naija-card bg-gradient-to-br from-white to-green-50 border-2 border-nigeria-gold',
    glass: 'afro-glass rounded-xl p-6'
  };

  const CardComponent = interactive ? motion.div : 'div';

  return (
    <CardComponent
      whileHover={interactive ? { scale: 1.02, y: -4 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        ${variantClasses[variant]}
        ${elevationClasses[elevation]}
        ${interactive ? 'cursor-pointer' : ''}
        transition-all duration-300
      `}
    >
      {children}
    </CardComponent>
  );
};

interface NigerianHeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onCtaClick: () => void;
  backgroundVariant?: 'flag' | 'ankara' | 'gradient' | 'video';
  showTrustBadges?: boolean;
}

export const NigerianHeroSection: React.FC<NigerianHeroSectionProps> = ({
  title,
  subtitle,
  ctaText,
  onCtaClick,
  backgroundVariant = 'flag',
  showTrustBadges = true
}) => {
  const getBackgroundClass = () => {
    switch (backgroundVariant) {
      case 'flag':
        return 'nigeria-flag-gradient';
      case 'ankara':
        return 'ankara-pattern opacity-30';
      case 'gradient':
        return 'bg-gradient-to-br from-nigeria-green via-nigeria-green-light to-nigeria-gold';
      default:
        return 'bg-nigeria-green';
    }
  };

  return (
    <section className={`relative min-h-[60vh] flex items-center justify-center ${getBackgroundClass()}`}>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20" />
      
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold mb-6 nigerian-heading"
        >
          {title}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl mb-8 text-white opacity-90"
        >
          {subtitle}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <NigerianButton size="lg" onClick={onCtaClick}>
            {ctaText}
          </NigerianButton>
          
          <NigerianButton variant="secondary" size="lg">
            Learn More
          </NigerianButton>
        </motion.div>
        
        {showTrustBadges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex flex-wrap justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>CBN Licensed</span>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>NITDA Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>NDPR Certified</span>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>256-bit Encryption</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

interface AnkaraPatternProps {
  className?: string;
  opacity?: number;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const AnkaraPattern: React.FC<AnkaraPatternProps> = ({
  className = '',
  opacity = 0.1,
  animated = true,
  size = 'medium'
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  const patternSize = sizeMap[size];

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(211, 47, 47, ${opacity}) 2px, transparent 2px),
          radial-gradient(circle at 75% 75%, rgba(25, 118, 210, ${opacity}) 2px, transparent 2px),
          radial-gradient(circle at 75% 25%, rgba(251, 192, 45, ${opacity}) 2px, transparent 2px),
          radial-gradient(circle at 25% 75%, rgba(123, 31, 162, ${opacity}) 2px, transparent 2px)
        `,
        backgroundSize: `${patternSize} ${patternSize}`,
        backgroundPosition: '0 0, 50% 50%, 50% 0, 0 50%',
        animation: animated ? 'ankara-float 20s ease-in-out infinite' : 'none'
      }}
    />
  );
};

export default {
  NigerianCulturalDesign,
  NigerianButton,
  NigerianCard,
  NigerianHeroSection,
  AnkaraPattern
};