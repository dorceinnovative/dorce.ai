-- Dorce.ai National Operating System - Complete Database Migration
-- Version: 1.0.0
-- Security Classification: National Grade
-- PostgreSQL 15+ Compatible

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types and enums
CREATE TYPE "UserRole" AS ENUM ('USER', 'MERCHANT', 'ADMIN', 'SUPERADMIN');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'BLOCKED');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE "TransactionType" AS ENUM ('TOPUP', 'WITHDRAWAL', 'TRANSFER', 'PURCHASE', 'REFUND');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "DocumentType" AS ENUM ('GOVERNMENT_ID', 'UTILITY_BILL', 'ADDRESS_PROOF', 'BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'PAYSLIP', 'TAX_DOCUMENT', 'BUSINESS_REGISTRATION', 'MEMORANDUM_ARTICLES', 'ARTICLES_ASSOCIATION', 'FORM_CO7', 'FORM_CO2', 'OTHER');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION', 'ALERT', 'INFO', 'PROMOTION', 'LOAN_APPLICATION_UPDATE', 'LOAN_DISBURSEMENT', 'REPAYMENT_REMINDER', 'CAC_UPDATE', 'GENERAL');
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED', 'DEFAULTED', 'CANCELLED');
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'WAIVED');
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "FraudAlertStatus" AS ENUM ('OPEN', 'REVIEWING', 'APPROVED', 'BLOCKED', 'RESOLVED');
CREATE TYPE "VerificationType" AS ENUM ('BVN', 'NIN', 'PHONE', 'EMAIL', 'LINKEDIN', 'EMPLOYMENT', 'ADDRESS', 'BANK_ACCOUNT');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');
CREATE TYPE "CACStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BusinessType" AS ENUM ('LIMITED_LIABILITY_COMPANY', 'BUSINESS_NAME', 'INCORPORATED_TRUSTEE', 'LIMITED_PARTNERSHIP', 'LIMITED_LIABILITY_PARTNERSHIP', 'PUBLIC_COMPANY', 'PRIVATE_COMPANY');
CREATE TYPE "CACRegistrationType" AS ENUM ('NEW_REGISTRATION', 'BUSINESS_NAME_REGISTRATION', 'COMPANY_REGISTRATION', 'POST_INCORPORATION', 'ANNUAL_RETURN', 'CHANGE_OF_DIRECTORS', 'CHANGE_OF_ADDRESS', 'OTHER_SERVICES');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "ProductCategory" AS ENUM ('AIRTIME', 'DATA', 'ELECTRICITY', 'PIN_VOUCHER');
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');
CREATE TYPE "ChatIntent" AS ENUM ('none', 'buy_airtime', 'pay_electricity', 'wallet_topup', 'check_balance', 'send_money', 'view_history');

-- E-commerce Enums
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED');
CREATE TYPE "ProductCategoryEcommerce" AS ENUM ('ELECTRONICS', 'FASHION', 'HOME_AND_GARDEN', 'SPORTS_AND_OUTDOORS', 'TOYS_AND_GAMES', 'BEAUTY_AND_PERSONAL_CARE', 'HEALTH_AND_WELLNESS', 'FOOD_AND_GROCERY', 'AUTOMOTIVE', 'BOOKS_AND_MEDIA', 'OFFICE_AND_STATIONERY', 'PET_SUPPLIES', 'BABY_AND_KIDS', 'JEWELRY_AND_ACCESSORIES', 'ART_AND_CRAFTS', 'TOOLS_AND_HARDWARE', 'MUSICAL_INSTRUMENTS', 'OTHER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RFQStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLOSED', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "CommissionScope" AS ENUM ('GLOBAL', 'STORE', 'CATEGORY');
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE "ServiceType" AS ENUM ('PHONE_REPAIR', 'LAPTOP_REPAIR', 'HOME_APPLIANCE', 'ELECTRICIAN', 'PLUMBER', 'CONSULTING', 'DELIVERY', 'OTHER');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- VTU Enums
CREATE TYPE "EPinService" AS ENUM ('WAEC', 'NECO', 'JAMB', 'NABTEB', 'GCE', 'OTHER');
CREATE TYPE "EducationService" AS ENUM ('WAEC_REGISTRATION', 'NECO_REGISTRATION', 'JAMB_REGISTRATION', 'JAMB_CHANGE_OF_COURSE', 'JAMB_CHANGE_OF_INSTITUTION', 'POST_UTME', 'OTHER');
CREATE TYPE "CableService" AS ENUM ('DSTV', 'GOTV', 'STARTIMES', 'SHOWMAX', 'OTHER');
CREATE TYPE "BettingPlatform" AS ENUM ('BET9JA', 'NAIRABET', 'MERRYBET', 'BETKING', 'SPORTYBET', 'BETWAY', 'SUREBET', 'OTHERS');

-- Security and Audit Enums
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'SYSTEM_CONTROL', 'CUSTOMER_DEPOSIT', 'MERCHANT_RESERVE', 'ESCROW_HOLDING', 'COMPLIANCE_RESERVE');
CREATE TYPE "TransactionCategory" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'COMMISSION', 'FEE', 'INTEREST', 'PENALTY', 'SYSTEM_ADJUSTMENT');
CREATE TYPE "LedgerStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED', 'CANCELLED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'MFA_ENABLE', 'MFA_DISABLE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'ROLE_ASSIGN', 'ROLE_REMOVE', 'TRANSACTION_INITIATE', 'TRANSACTION_APPROVE', 'TRANSACTION_REJECT', 'TRANSACTION_REVERSE', 'ESCROW_CREATE', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'DISPUTE_RAISE', 'DISPUTE_RESOLVE', 'COMPLIANCE_FLAG', 'SECURITY_ALERT');
CREATE TYPE "ResourceType" AS ENUM ('USER', 'WALLET', 'TRANSACTION', 'ESCROW', 'ORDER', 'PRODUCT', 'STORE', 'DOCUMENT', 'KYC', 'LOAN', 'DISPUTE', 'COMPLIANCE_REPORT', 'AUDIT_LOG', 'SYSTEM_CONFIG');
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_ANOMALY', 'TRANSACTION_ANOMALY', 'ESCROW_ANOMALY', 'PERMISSION_ESCALATION', 'DATA_ACCESS_ANOMALY', 'SYSTEM_INTRUSION', 'MALWARE_DETECTION', 'DDOS_ATTEMPT', 'BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_API_USAGE', 'GEOGRAPHIC_ANOMALY', 'DEVICE_ANOMALY');
CREATE TYPE "EventSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "InvestigationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'ESCALATED');
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON "User"(phone);
CREATE INDEX IF NOT EXISTS idx_users_nin ON "User"(nin);
CREATE INDEX IF NOT EXISTS idx_users_bvn ON "User"(bvn);
CREATE INDEX IF NOT EXISTS idx_users_status ON "User"(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON "User"(created_at DESC);

-- Wallet and Transaction indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON "Wallet"(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON "WalletTransaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON "WalletTransaction"(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON "WalletTransaction"(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON "WalletTransaction"(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON "WalletTransaction"(created_at DESC);

-- Loan indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON "LoanApplication"(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON "LoanApplication"(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON "LoanApplication"(created_at DESC);

-- KYC and Verification indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON "KYC"(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON "KYC"(status);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON "Verification"(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_type ON "Verification"(type);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON "Verification"(status);

-- E-commerce indexes
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON "Store"(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON "Store"(slug);
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON "Store"(subdomain);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON "StoreProduct"(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON "StoreProduct"(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON "StoreProduct"(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON "Order"(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON "Order"(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order"(status);

-- Security and Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "AuditLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "AuditLog"(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON "AuditLog"(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON "AuditLog"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON "SecurityEvent"(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON "SecurityEvent"(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON "SecurityEvent"(severity);

-- Telecom indexes
CREATE INDEX IF NOT EXISTS idx_recharge_user_id ON "RechargeTransaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_product_id ON "RechargeTransaction"(product_id);
CREATE INDEX IF NOT EXISTS idx_recharge_reference ON "RechargeTransaction"(reference);
CREATE INDEX IF NOT EXISTS idx_electricity_user_id ON "ElectricityTransaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_electricity_meter_number ON "ElectricityTransaction"(meter_number);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_users_name_gin ON "User" USING gin(to_tsvector('english', first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_stores_name_gin ON "Store" USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON "StoreProduct" USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Create system accounts for ledger
INSERT INTO "LedgerAccount" (id, account_number, account_type, currency, balance, is_system, description, created_at, updated_at) VALUES
(gen_random_uuid(), '1000000001', 'SYSTEM_CONTROL', 'NGN', 0, true, 'System Control Account', NOW(), NOW()),
(gen_random_uuid(), '2000000001', 'CUSTOMER_DEPOSIT', 'NGN', 0, true, 'Customer Deposits Liability', NOW(), NOW()),
(gen_random_uuid(), '3000000001', 'MERCHANT_RESERVE', 'NGN', 0, true, 'Merchant Reserve Account', NOW(), NOW()),
(gen_random_uuid(), '4000000001', 'ESCROW_HOLDING', 'NGN', 0, true, 'Escrow Holding Account', NOW(), NOW()),
(gen_random_uuid(), '5000000001', 'COMPLIANCE_RESERVE', 'NGN', 0, true, 'Compliance Reserve Account', NOW(), NOW());

-- Create default subscription plans
INSERT INTO "SubscriptionPlan" (id, name, description, price, currency, billing_cycle, features, is_active, trial_days, created_at, updated_at) VALUES
(gen_random_uuid(), 'Basic Plan', 'Basic access to Dorce.ai services', 1000.00, 'NGN', 'monthly', '["Basic wallet", "Limited transactions", "Basic support"]', true, 7, NOW(), NOW()),
(gen_random_uuid(), 'Premium Plan', 'Premium access with advanced features', 5000.00, 'NGN', 'monthly', '["Advanced wallet", "Unlimited transactions", "Priority support", "Advanced analytics", "Business tools"]', true, 14, NOW(), NOW()),
(gen_random_uuid(), 'Enterprise Plan', 'Full enterprise-grade access', 20000.00, 'NGN', 'monthly', '["Enterprise wallet", "Unlimited transactions", "24/7 support", "Advanced analytics", "Business tools", "API access", "Custom integrations"]', true, 30, NOW(), NOW());

-- Create default telecom products
INSERT INTO "Product" (id, name, category, description, provider, price, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'MTN Airtime', 'AIRTIME', 'MTN Nigeria airtime top-up', 'MTN', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'Glo Airtime', 'AIRTIME', 'Glo Nigeria airtime top-up', 'Glo', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'Airtel Airtime', 'AIRTIME', 'Airtel Nigeria airtime top-up', 'Airtel', 0, true, NOW(), NOW()),
(gen_random_uuid(), '9mobile Airtime', 'AIRTIME', '9mobile Nigeria airtime top-up', '9mobile', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'MTN Data', 'DATA', 'MTN Nigeria data bundles', 'MTN', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'Glo Data', 'DATA', 'Glo Nigeria data bundles', 'Glo', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'Airtel Data', 'DATA', 'Airtel Nigeria data bundles', 'Airtel', 0, true, NOW(), NOW()),
(gen_random_uuid(), '9mobile Data', 'DATA', '9mobile Nigeria data bundles', '9mobile', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'IKEDC Electricity', 'ELECTRICITY', 'Ikeja Electric bill payment', 'IKEDC', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'EKEDC Electricity', 'ELECTRICITY', 'Eko Electric bill payment', 'EKEDC', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'AEDC Electricity', 'ELECTRICITY', 'Abuja Electric bill payment', 'AEDC', 0, true, NOW(), NOW()),
(gen_random_uuid(), 'PHED Electricity', 'ELECTRICITY', 'Port Harcourt Electric bill payment', 'PHED', 0, true, NOW(), NOW());

-- Create system user for automated processes
INSERT INTO "User" (id, email, phone, first_name, last_name, password_hash, role, status, email_verified, phone_verified, is_active, is_blocked, created_at, updated_at) VALUES
(gen_random_uuid(), 'system@dorce.ai', '+2348000000000', 'System', 'Account', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', 'SUPERADMIN', 'ACTIVE', true, true, true, false, NOW(), NOW());

-- Set up Row Level Security (RLS) for security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoanApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KYC" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy and security
CREATE POLICY "Users can only see their own data" ON "User" FOR SELECT USING (id = current_setting('app.current_user_id')::text);
CREATE POLICY "Users can only see their own wallets" ON "Wallet" FOR SELECT USING (user_id = current_setting('app.current_user_id')::text);
CREATE POLICY "Users can only see their own transactions" ON "WalletTransaction" FOR SELECT USING (user_id = current_setting('app.current_user_id')::text);
CREATE POLICY "Users can only see their own loans" ON "LoanApplication" FOR SELECT USING (user_id = current_setting('app.current_user_id')::text);
CREATE POLICY "Users can only see their own KYC" ON "KYC" FOR SELECT USING (user_id = current_setting('app.current_user_id')::text);
CREATE POLICY "Users can only see their own documents" ON "Document" FOR SELECT USING (user_id = current_setting('app.current_user_id')::text);

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dorce_ai_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO dorce_ai_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO dorce_ai_app;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dorce_ai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO dorce_ai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO dorce_ai_app;