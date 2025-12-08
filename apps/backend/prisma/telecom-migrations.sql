-- Telecom Transaction Table for tracking all telecom purchases
CREATE TABLE telecom_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('airtime', 'data', 'electricity', 'cable', 'betting')),
    network TEXT NOT NULL CHECK (network IN ('mtn', 'airtel', 'glo', '9mobile', 'smile', 'dstv', 'gotv', 'startimes', 'showmax', 'bet9ja', 'betking', 'betway', '1xbet')),
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0.00,
    phone TEXT,
    meter_number TEXT,
    iuc_number TEXT,
    variation TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_telecom_transactions_user_id ON telecom_transactions(user_id);
CREATE INDEX idx_telecom_transactions_service_type ON telecom_transactions(service_type);
CREATE INDEX idx_telecom_transactions_network ON telecom_transactions(network);
CREATE INDEX idx_telecom_transactions_status ON telecom_transactions(status);
CREATE INDEX idx_telecom_transactions_provider ON telecom_transactions(provider_id);
CREATE INDEX idx_telecom_transactions_created_at ON telecom_transactions(created_at);
CREATE INDEX idx_telecom_transactions_transaction_id ON telecom_transactions(transaction_id);

-- Telecom Providers Table for managing multiple aggregators
CREATE TABLE telecom_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    services TEXT[] NOT NULL DEFAULT '{}',
    commission_rate DECIMAL(5,4) DEFAULT 0.0000,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
    config JSONB DEFAULT '{}',
    api_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default telecom providers
INSERT INTO telecom_providers (id, name, priority, services, commission_rate, status, config) VALUES
('vtpass', 'VTPass', 1, ARRAY['airtime', 'data', 'electricity', 'cable', 'betting'], 0.0350, 'active', '{"base_url": "https://sandbox.vtpass.com/api", "supports_webhook": true}'),
('billspay', 'BillsPay', 2, ARRAY['airtime', 'data', 'electricity'], 0.0300, 'active', '{"base_url": "https://api.billspay.com", "supports_webhook": true}'),
('vtu', 'VTU.ng', 3, ARRAY['airtime', 'data'], 0.0400, 'active', '{"base_url": "https://vtu.ng/api", "supports_webhook": false}');

-- Telecom Pricing Table for real-time price tracking
CREATE TABLE telecom_pricing (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL REFERENCES telecom_providers(id),
    service_type TEXT NOT NULL CHECK (service_type IN ('airtime', 'data', 'electricity', 'cable', 'betting')),
    network TEXT NOT NULL,
    variation_id TEXT,
    variation_name TEXT,
    price DECIMAL(10,2) NOT NULL,
    commission DECIMAL(5,4) DEFAULT 0.0000,
    availability BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pricing queries
CREATE INDEX idx_telecom_pricing_provider ON telecom_pricing(provider_id);
CREATE INDEX idx_telecom_pricing_service ON telecom_pricing(service_type);
CREATE INDEX idx_telecom_pricing_network ON telecom_pricing(network);
CREATE INDEX idx_telecom_pricing_availability ON telecom_pricing(availability);
CREATE INDEX idx_telecom_pricing_last_updated ON telecom_pricing(last_updated);

-- Telecom Analytics Table for business intelligence
CREATE TABLE telecom_analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL REFERENCES telecom_providers(id),
    service_type TEXT NOT NULL,
    network TEXT NOT NULL,
    date DATE NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    total_commission DECIMAL(15,2) DEFAULT 0.00,
    average_response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint for daily analytics
CREATE UNIQUE INDEX idx_telecom_analytics_unique ON telecom_analytics(provider_id, service_type, network, date);

-- Telecom Intent Recognition Table for AI training
CREATE TABLE telecom_intents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_message TEXT NOT NULL,
    detected_intent TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    entities JSONB DEFAULT '{}',
    was_successful BOOLEAN DEFAULT false,
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for AI training data
CREATE INDEX idx_telecom_intents_intent ON telecom_intents(detected_intent);
CREATE INDEX idx_telecom_intents_confidence ON telecom_intents(confidence_score);
CREATE INDEX idx_telecom_intents_successful ON telecom_intents(was_successful);
CREATE INDEX idx_telecom_intents_created_at ON telecom_intents(created_at);