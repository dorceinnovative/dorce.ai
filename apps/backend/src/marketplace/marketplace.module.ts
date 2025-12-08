import { Module } from "@nestjs/common"
import { HttpModule } from '@nestjs/axios'
import { PrismaModule } from "../prisma/prisma.module"
import { WalletModule } from "../wallets/wallet.module"
import { NotificationModule } from "../notification/notification.module"
import { CacheModule } from "../cache/cache.module"
import { MarketplaceService } from "./marketplace.service"
import { MarketplaceController } from "./marketplace.controller"
import { MarketplaceEcommerceController } from "./marketplace-ecommerce.controller"
import { VendorController } from "../controllers/vendor.controller"
import { SubscriptionController } from "../controllers/subscription.controller"
import { SubscriptionMarketplaceService } from "../services/subscription-marketplace.service"
import { MarketplaceCartService } from "../services/marketplace-cart.service"
import { MarketplaceCheckoutService } from "../services/marketplace-checkout.service"
import { MarketplaceOrderService } from "../services/marketplace-order.service"
import { VendorOnboardingSimpleService } from "../services/vendor-onboarding-simple.service"
import { PaymentIntegrationService } from "../services/payment-integration.service"
import { EscrowLedgerService } from "../services/escrow-ledger.service"
import { CommissionService } from "../services/commission.service"
import { CouponService } from "../services/coupon.service"

@Module({
  imports: [PrismaModule, WalletModule, NotificationModule, CacheModule, HttpModule],
  controllers: [MarketplaceController, MarketplaceEcommerceController, VendorController, SubscriptionController],
  providers: [
    MarketplaceService,
    MarketplaceCartService,
    MarketplaceCheckoutService,
    MarketplaceOrderService,
    VendorOnboardingSimpleService,
    PaymentIntegrationService,
    EscrowLedgerService,
    CommissionService,
    CouponService,
    SubscriptionMarketplaceService
  ],
  exports: [
    MarketplaceService,
    MarketplaceCartService,
    MarketplaceCheckoutService,
    MarketplaceOrderService,
    VendorOnboardingSimpleService
  ],
})
export class MarketplaceModule {}
