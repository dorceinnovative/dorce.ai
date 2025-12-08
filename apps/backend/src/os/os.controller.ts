import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Put } from '@nestjs/common';
import { OSKernelService, OSWindow, OSNotification, OSSystemState } from './os-kernel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('api/os')
@UseGuards(JwtAuthGuard)
export class OSController {
  constructor(private readonly osKernelService: OSKernelService) {}

  @Get('system-state')
  async getSystemState(@CurrentUser() user: User): Promise<OSSystemState> {
    return this.osKernelService.getSystemState();
  }

  @Get('apps')
  async getAvailableApps(@CurrentUser() user: User) {
    return this.osKernelService.getAvailableApps();
  }

  @Get('apps/:appId')
  async getApp(@Param('appId') appId: string, @CurrentUser() user: User) {
    const app = this.osKernelService.getAppById(appId);
    if (!app) {
      throw new Error(`App ${appId} not found`);
    }
    return app;
  }

  @Post('apps/:appId/launch')
  async launchApp(
    @Param('appId') appId: string,
    @CurrentUser() user: User,
  ): Promise<OSWindow> {
    const userPermissions = this.getUserPermissions(user);
    return this.osKernelService.launchApp(appId, user.id, userPermissions);
  }

  @Delete('apps/:appId/close')
  async closeApp(
    @Param('appId') appId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.osKernelService.closeApp(appId, user.id);
  }

  @Put('windows/:windowId')
  async updateWindow(
    @Param('windowId') windowId: string,
    @Body() updates: Partial<OSWindow>,
    @CurrentUser() user: User,
  ): Promise<OSWindow> {
    return this.osKernelService.updateWindow(windowId, updates);
  }

  @Delete('windows/:windowId')
  async closeWindow(
    @Param('windowId') windowId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    // Find the app associated with this window
    const systemState = this.osKernelService.getSystemState();
    const window = systemState.activeWindows.find(w => w.id === windowId);
    if (window) {
      return this.osKernelService.closeApp(window.appId, user.id);
    }
    throw new Error(`Window ${windowId} not found`);
  }

  @Get('notifications')
  async getNotifications(@CurrentUser() user: User): Promise<OSNotification[]> {
    const systemState = this.osKernelService.getSystemState();
    return systemState.notifications;
  }

  @Post('notifications')
  async sendNotification(
    @Body() notification: Omit<OSNotification, 'id' | 'timestamp' | 'isRead'>,
    @CurrentUser() user: User,
  ): Promise<OSNotification> {
    return this.osKernelService.sendNotification(notification);
  }

  @Put('notifications/:notificationId/read')
  async markNotificationRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.osKernelService.markNotificationRead(notificationId);
  }

  @Delete('notifications')
  async clearNotifications(@CurrentUser() user: User): Promise<void> {
    // This would require additional method in service
    const systemState = this.osKernelService.getSystemState();
    systemState.notifications.forEach(notification => {
      this.osKernelService.markNotificationRead(notification.id);
    });
  }

  @Post('system/restart')
  async restartSystem(@CurrentUser() user: User): Promise<void> {
    // Only admin can restart the system
    if (user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions to restart system');
    }
    return this.osKernelService.restartSystem();
  }

  @Get('system/resources')
  async getSystemResources(@CurrentUser() user: User) {
    const systemState = this.osKernelService.getSystemState();
    return systemState.systemResources;
  }

  @Get('system/processes')
  async getSystemProcesses(@CurrentUser() user: User) {
    const systemState = this.osKernelService.getSystemState();
    return systemState.processes;
  }

  @Delete('system/processes/:processId')
  async killProcess(
    @Param('processId') processId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    // Only admin can kill processes
    if (user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions to kill processes');
    }
    return this.osKernelService.killProcess(processId);
  }

  private getUserPermissions(user: User): string[] {
    const permissions: string[] = [];
    
    // Add role-based permissions
    if (user.role === 'ADMIN') {
      permissions.push('admin');
    }
    
    // Add specific permissions based on user attributes
    if (user.emailVerified && user.phoneVerified) {
      permissions.push('verified');
    }
    
    // Add app-specific permissions based on user roles
    if (user.role === 'MERCHANT') {
      permissions.push('marketplace', 'business', 'analytics');
    }
    
    // Default permissions for all users
    permissions.push(
      'chat', 'notifications', 'file-access', 'wallet', 'payments',
      'crypto', 'tax', 'documents', 'news', 'community', 'forums'
    );
    
    return permissions;
  }
}