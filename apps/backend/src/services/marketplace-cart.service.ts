import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CacheService } from './cache.service';

interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface CartData {
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    vendorId: string;
    vendorName: string;
    price: bigint;
    quantity: number;
    subtotal: bigint;
    imageUrl: string;
    variant?: {
      id: string;
      name: string;
      price: bigint;
    };
  }>;
  totals: {
    subtotal: bigint;
    shipping: bigint;
    tax: bigint;
    total: bigint;
  };
  vendors: Array<{
    vendorId: string;
    vendorName: string;
    subtotal: bigint;
    shipping: bigint;
    items: number;
  }>;
}

@Injectable()
export class MarketplaceCartService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private cacheService: CacheService,
  ) {}

  async addToCart(userId: string, item: CartItem): Promise<CartData> {
    const cacheKey = `cart:${userId}`;
    
    // Get product details with vendor info
    const product = await this.prisma.storeProduct.findUnique({
      where: { id: item.productId },
      include: {
        store: true,
        variants: item.variantId ? { where: { id: item.variantId } } : false,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product not available');
    }

    // Check inventory availability
    const availableQuantity = product.inventory?.quantity || 0;
    if (availableQuantity < item.quantity) {
      throw new BadRequestException('Product not available in requested quantity');
    }

    let price = product.price;
    let variantData = null;

    if (item.variantId) {
      const variant = product.variants[0];
      if (!variant) {
        throw new BadRequestException('Product variant not found');
      }
      
      // Check variant inventory
      const variantInventory = await this.prisma.inventory.findUnique({
        where: { variantId: variant.id },
      });
      
      const variantAvailableQuantity = variantInventory?.quantity || 0;
      if (variantAvailableQuantity < item.quantity) {
        throw new BadRequestException('Product variant not available in requested quantity');
      }
      
      price = variant.price || product.price;
      variantData = {
        id: variant.id,
        name: variant.name,
        price: variant.price || product.price,
      } as any;
    }

    const existingCart = await this.cacheService.get(cacheKey) || { items: [] };
    
    // Check if item already exists in cart
    const existingItemIndex = existingCart.items.findIndex(
      cartItem => cartItem.productId === item.productId && 
                  cartItem.variant?.id === item.variantId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      existingCart.items[existingItemIndex].quantity += item.quantity;
      existingCart.items[existingItemIndex].subtotal = 
        existingCart.items[existingItemIndex].price * BigInt(existingCart.items[existingItemIndex].quantity);
    } else {
      // Add new item
      existingCart.items.push({
        id: `${item.productId}-${item.variantId || 'default'}-${Date.now()}`,
        productId: item.productId,
        productName: product.name,
        vendorId: product.storeId,
        vendorName: product.store.name,
        price,
        quantity: item.quantity,
        subtotal: price * BigInt(item.quantity),
        imageUrl: product.images?.[0] || '',
        variant: variantData,
      });
    }

    const cartData = await this.calculateCartTotals(existingCart);
    await this.cacheService.set(cacheKey, cartData, 86400); // 24 hours

    return cartData;
  }

  async getCart(userId: string): Promise<CartData> {
    const cacheKey = `cart:${userId}`;
    const cachedCart = await this.cacheService.get(cacheKey);
    
    if (cachedCart) {
      return cachedCart;
    }

    return {
      items: [],
      totals: {
        subtotal: BigInt(0),
        shipping: BigInt(0),
        tax: BigInt(0),
        total: BigInt(0),
      },
      vendors: [],
    };
  }

  async updateCartItem(userId: string, itemId: string, quantity: number): Promise<CartData> {
    const cacheKey = `cart:${userId}`;
    const existingCart = await this.cacheService.get(cacheKey);

    if (!existingCart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = existingCart.items.findIndex(item => item.id === itemId);
    if (itemIndex < 0) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      return this.removeCartItem(userId, itemId);
    }

    // Validate stock availability
    const item = existingCart.items[itemIndex];
    const product = await this.prisma.storeProduct.findUnique({
      where: { id: item.productId },
      include: {
        variants: item.variant?.id ? { where: { id: item.variant.id } } : false,
        inventory: true,
      },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const availableQuantity = product.inventory?.quantity || 0;
    if (availableQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    if (item.variant?.id) {
      const variantInventory = await this.prisma.inventory.findUnique({
        where: { variantId: item.variant.id },
      });
      
      const variantAvailableQuantity = variantInventory?.quantity || 0;
      if (variantAvailableQuantity < quantity) {
        throw new BadRequestException('Insufficient variant stock');
      }
    }

    existingCart.items[itemIndex].quantity = quantity;
    existingCart.items[itemIndex].subtotal = item.price * BigInt(quantity);

    const cartData = await this.calculateCartTotals(existingCart);
    await this.cacheService.set(cacheKey, cartData, 86400);

    return cartData;
  }

  async removeCartItem(userId: string, itemId: string): Promise<CartData> {
    const cacheKey = `cart:${userId}`;
    const existingCart = await this.cacheService.get(cacheKey);

    if (!existingCart) {
      throw new NotFoundException('Cart not found');
    }

    existingCart.items = existingCart.items.filter(item => item.id !== itemId);

    const cartData = await this.calculateCartTotals(existingCart);
    await this.cacheService.set(cacheKey, cartData, 86400);

    return cartData;
  }

  async clearCart(userId: string): Promise<void> {
    const cacheKey = `cart:${userId}`;
    await this.cacheService.delete(cacheKey);
  }

  private async calculateCartTotals(cart: any): Promise<CartData> {
    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, BigInt(0));
    
    // Group by vendor for shipping calculations
    const vendorGroups = cart.items.reduce((groups, item) => {
      if (!groups[item.vendorId]) {
        groups[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          subtotal: BigInt(0),
          items: 0,
        };
      }
      groups[item.vendorId].subtotal += item.subtotal;
      groups[item.vendorId].items += 1;
      return groups;
    }, {});

    // Calculate shipping per vendor (simplified - in real app, use vendor shipping rules)
    let totalShipping = BigInt(0);
    const vendors = Object.values(vendorGroups).map((vendor: any) => {
      const shipping = vendor.subtotal > 5000 ? BigInt(0) : BigInt(500); // Free shipping over ₦50
      totalShipping += shipping;
      return {
        ...vendor,
        shipping,
      };
    });

    // Calculate tax (5% VAT)
    const tax = (subtotal * BigInt(5)) / BigInt(100);
    const total = subtotal + totalShipping + tax;

    return {
      items: cart.items,
      totals: {
        subtotal,
        shipping: totalShipping,
        tax,
        total,
      },
      vendors,
    };
  }

  async validateCartForCheckout(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const cart = await this.getCart(userId);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    // Validate each item's availability and pricing
    for (const item of cart.items) {
      const product = await this.prisma.storeProduct.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.variant?.id ? { where: { id: item.variant.id } } : false,
          inventory: true,
        },
      });

      if (!product || !product.isActive) {
        errors.push(`Product "${item.productName}" is no longer available`);
        continue;
      }

      const availableQuantity = product.inventory?.quantity || 0;
      if (availableQuantity < item.quantity) {
        errors.push(`Product "${item.productName}" has insufficient stock`);
      }

      // Check if price has changed
      const currentPrice = item.variant?.id ? (product.variants[0]?.price || product.price) : product.price;
      if (currentPrice !== item.price) {
        errors.push(`Price for "${item.productName}" has changed`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}