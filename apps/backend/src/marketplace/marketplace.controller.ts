import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { MarketplaceService } from "./marketplace.service"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { CreateProductDto, UpdateProductDto, GetProductsDto } from "./dto/product.dto"
import {
  PurchaseAirtimeDto,
  PurchaseElectricityDto,
  ProcessPaymentDto,
  GetTransactionsDto,
} from "./dto/purchase.dto"

@ApiTags("marketplace")
@Controller("api/marketplace")
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  // Product Management (Admin)
  @Post('products')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (admin)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() dto: CreateProductDto) {
    return this.marketplaceService.createProduct(dto)
  }

  @Put("products/:productId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a product (admin)" })
  @ApiResponse({ status: 200, description: "Product updated" })
  async updateProduct(@Param('productId') productId: string, @Body() dto: UpdateProductDto) {
    return this.marketplaceService.updateProduct(productId, dto)
  }

  @Get('products')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts(@Query() dto: GetProductsDto) {
    return this.marketplaceService.getProducts(dto)
  }

  @Get('products/:productId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific product' })
  @ApiResponse({ status: 200, description: 'Product retrieved' })
  async getProduct(@Param('productId') productId: string) {
    return this.marketplaceService.getProduct(productId)
  }

  // Purchases
  @Post("purchases/airtime")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Purchase airtime" })
  @ApiResponse({ status: 200, description: "Airtime purchase initiated" })
  @HttpCode(HttpStatus.OK)
  async purchaseAirtime(@Body() dto: PurchaseAirtimeDto, @CurrentUser() userId: string) {
    return this.marketplaceService.purchaseAirtime(userId, dto)
  }

  @Post("purchases/electricity")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Purchase electricity" })
  @ApiResponse({ status: 200, description: "Electricity purchase initiated" })
  @HttpCode(HttpStatus.OK)
  async purchaseElectricity(@Body() dto: PurchaseElectricityDto, @CurrentUser() userId: string) {
    return this.marketplaceService.purchaseElectricity(userId, dto)
  }

  // Transactions
  @Get("transactions/airtime")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get airtime transactions" })
  @ApiResponse({ status: 200, description: "Airtime transactions retrieved" })
  async getAirtimeTransactions(@Query() dto: GetTransactionsDto, @CurrentUser() userId: string) {
    return this.marketplaceService.getAirtimeTransactions(userId, dto)
  }

  @Get("transactions/electricity")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get electricity transactions" })
  @ApiResponse({ status: 200, description: "Electricity transactions retrieved" })
  async getElectricityTransactions(@Query() dto: GetTransactionsDto, @CurrentUser() userId: string) {
    return this.marketplaceService.getElectricityTransactions(userId, dto)
  }

  @Post("transactions/confirm")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm payment for transaction" })
  @ApiResponse({ status: 200, description: "Payment confirmed" })
  @HttpCode(HttpStatus.OK)
  async processPaymentConfirmation(@Body() dto: ProcessPaymentDto, @CurrentUser() userId: string) {
    return this.marketplaceService.processPaymentConfirmation(userId, dto)
  }

  @Post("transactions/:transactionId/refund")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Refund a transaction" })
  @ApiResponse({ status: 200, description: "Transaction refunded" })
  @HttpCode(HttpStatus.OK)
  async refundTransaction(@Param('transactionId') transactionId: string, @Body('reason') reason: string) {
    if (!reason) {
      throw new BadRequestException("Refund reason is required")
    }
    return this.marketplaceService.refundTransaction(transactionId, reason)
  }

  // Statistics (Admin)
  @Get("statistics")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get marketplace statistics (admin)" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics() {
    return this.marketplaceService.getStatistics()
  }
}
