import { Injectable, Logger } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

export interface OSApp {
  id: string;
  name: string;
  icon: string;
  windowId?: string;
  isRunning: boolean;
  permissions: string[];
  memoryUsage: number;
  cpuUsage: number;
}

export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: number;
}

export interface OSNotification {
  id: string;
  appId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  actions?: OSNotificationAction[];
}

export interface OSNotificationAction {
  id: string;
  label: string;
  action: string;
  payload?: any;
}

export interface OSProcess {
  id: string;
  appId: string;
  pid: number;
  status: 'running' | 'suspended' | 'terminated';
  memoryUsage: number;
  cpuUsage: number;
  startTime: Date;
}

export interface OSSystemState {
  activeWindows: OSWindow[];
  runningApps: OSApp[];
  notifications: OSNotification[];
  processes: OSProcess[];
  systemResources: {
    memory: { used: number; total: number; percentage: number };
    cpu: { usage: number; cores: number };
    storage: { used: number; total: number; percentage: number };
  };
  user: {
    id: string;
    username: string;
    permissions: string[];
    isAdmin: boolean;
  };
}

@Injectable()
export class OSKernelService {
  private readonly logger = new Logger(OSKernelService.name);
  
  private apps: Map<string, OSApp> = new Map();
  private windows: Map<string, OSWindow> = new Map();
  private processes: Map<string, OSProcess> = new Map();
  private notifications: OSNotification[] = [];
  private systemState: OSSystemState;
  private windowIdCounter = 0;
  private zIndexCounter = 1000;

  constructor(
    // private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
  ) {
    this.initializeSystem();
  }

  private initializeSystem() {
    this.systemState = {
      activeWindows: [],
      runningApps: [],
      notifications: [],
      processes: [],
      systemResources: {
        memory: { used: 0, total: 16 * 1024 * 1024 * 1024, percentage: 0 }, // 16GB
        cpu: { usage: 0, cores: 8 },
        storage: { used: 0, total: 256 * 1024 * 1024 * 1024, percentage: 0 }, // 256GB
      },
      user: {
        id: '',
        username: '',
        permissions: [],
        isAdmin: false,
      },
    };

    this.registerBuiltInApps();
  }

  private registerBuiltInApps() {
    const builtInApps: OSApp[] = [
      {
        id: 'dorce-chat',
        name: 'Dorce Chat',
        icon: '💬',
        isRunning: false,
        permissions: ['chat', 'notifications', 'file-access'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-marketplace',
        name: 'Dorce Marketplace',
        icon: '🏪',
        isRunning: false,
        permissions: ['marketplace', 'payments', 'notifications'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-wallet',
        name: 'Dorce Pay',
        icon: '💳',
        isRunning: false,
        permissions: ['wallet', 'payments', 'notifications'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-crypto',
        name: 'Dorce Crypto',
        icon: '₿',
        isRunning: false,
        permissions: ['crypto', 'wallet', 'kyc'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-tax',
        name: 'Dorce Tax',
        icon: '📊',
        isRunning: false,
        permissions: ['tax', 'documents', 'payments'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-education',
        name: 'Dorce School',
        icon: '🎓',
        isRunning: false,
        permissions: ['education', 'cbt', 'documents'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-farms',
        name: 'Dorce Farms',
        icon: '🌾',
        isRunning: false,
        permissions: ['farming', 'marketplace', 'weather'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-news',
        name: 'Dorce News',
        icon: '📰',
        isRunning: false,
        permissions: ['news', 'ai-summary'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-community',
        name: 'Dorce Community',
        icon: '👥',
        isRunning: false,
        permissions: ['community', 'forums', 'moderation'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
      {
        id: 'dorce-business',
        name: 'Subscription Marketplace',
        icon: '🔄',
        isRunning: false,
        permissions: ['subscriptions', 'marketplace', 'payments', 'billing'],
        memoryUsage: 0,
        cpuUsage: 0,
      },
    ];

    builtInApps.forEach(app => {
      this.apps.set(app.id, app);
    });
  }

  async launchApp(appId: string, userId: string, userPermissions: string[]): Promise<OSWindow> {
    const app = this.apps.get(appId);
    if (!app) {
      throw new Error(`App ${appId} not found`);
    }

    // Check permissions
    const hasPermission = app.permissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('admin')
    );

    if (!hasPermission) {
      throw new Error(`Insufficient permissions to launch ${appId}`);
    }

    // Create process
    const process = this.createProcess(appId);
    this.processes.set(process.id, process);

    // Create window
    const window = this.createWindow(appId, app.name);
    this.windows.set(window.id, window);

    // Update app state
    app.isRunning = true;
    app.windowId = window.id;
    this.apps.set(appId, app);

    // Update system state
    this.updateSystemState();

    // Emit event
    // this.eventEmitter.emit('app.launched', { appId, windowId: window.id, userId });

    this.logger.log(`App ${appId} launched by user ${userId}`);
    return window;
  }

  async closeApp(appId: string, userId: string): Promise<void> {
    const app = this.apps.get(appId);
    if (!app || !app.isRunning) {
      return;
    }

    // Find and close associated window
    if (app.windowId) {
      const window = this.windows.get(app.windowId);
      if (window) {
        this.closeWindow(window.id);
      }
    }

    // Terminate process
    const processes = Array.from(this.processes.values()).filter(p => p.appId === appId);
    processes.forEach(process => {
      process.status = 'terminated';
      this.processes.delete(process.id);
    });

    // Update app state
    app.isRunning = false;
    app.windowId = undefined;
    this.apps.set(appId, app);

    // Update system state
    this.updateSystemState();

    // Emit event
    // this.eventEmitter.emit('app.closed', { appId, userId });

    this.logger.log(`App ${appId} closed by user ${userId}`);
  }

  private createWindow(appId: string, title: string): OSWindow {
    const windowId = `window-${++this.windowIdCounter}`;
    const window: OSWindow = {
      id: windowId,
      appId,
      title,
      position: { x: 100 + (this.windowIdCounter * 30), y: 100 + (this.windowIdCounter * 30) },
      size: { width: 1200, height: 800 },
      isMinimized: false,
      isMaximized: false,
      isActive: true,
      zIndex: ++this.zIndexCounter,
    };

    // Deactivate other windows
    this.windows.forEach(w => w.isActive = false);

    return window;
  }

  private closeWindow(windowId: string): void {
    const window = this.windows.get(windowId);
    if (window) {
      this.windows.delete(windowId);
      
      // Activate the next window if available
      const remainingWindows = Array.from(this.windows.values());
      if (remainingWindows.length > 0) {
        const topWindow = remainingWindows.reduce((prev, current) => 
          prev.zIndex > current.zIndex ? prev : current
        );
        topWindow.isActive = true;
      }
    }
  }

  private createProcess(appId: string): OSProcess {
    return {
      id: `process-${uuidv4()}`,
      appId,
      pid: Math.floor(Math.random() * 10000),
      status: 'running',
      memoryUsage: Math.floor(Math.random() * 100) + 50, // MB
      cpuUsage: Math.floor(Math.random() * 10) + 1, // %
      startTime: new Date(),
    };
  }

  async sendNotification(notification: Omit<OSNotification, 'id' | 'timestamp' | 'isRead'>): Promise<OSNotification> {
    const fullNotification: OSNotification = {
      ...notification,
      id: `notif-${uuidv4()}`,
      timestamp: new Date(),
      isRead: false,
    };

    this.notifications.push(fullNotification);
    
    // Limit notifications to 100
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }

    // Emit event
    // this.eventEmitter.emit('notification.sent', fullNotification);

    this.logger.log(`Notification sent: ${fullNotification.title}`);
    return fullNotification;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      // this.eventEmitter.emit('notification.read', notificationId);
    }
  }

  getSystemState(): OSSystemState {
    this.updateSystemState();
    return this.systemState;
  }

  private updateSystemState(): void {
    this.systemState = {
      activeWindows: Array.from(this.windows.values()),
      runningApps: Array.from(this.apps.values()).filter(app => app.isRunning),
      notifications: [...this.notifications],
      processes: Array.from(this.processes.values()),
      systemResources: {
        memory: {
          used: Array.from(this.processes.values()).reduce((sum, p) => sum + p.memoryUsage, 0) * 1024 * 1024,
          total: this.systemState.systemResources.memory.total,
          percentage: 0,
        },
        cpu: {
          usage: Array.from(this.processes.values()).reduce((sum, p) => sum + p.cpuUsage, 0),
          cores: this.systemState.systemResources.cpu.cores,
        },
        storage: {
          used: Math.floor(Math.random() * 50 * 1024 * 1024 * 1024), // Random for demo
          total: this.systemState.systemResources.storage.total,
          percentage: 0,
        },
      },
      user: { ...this.systemState.user },
    };

    // Calculate percentages
    this.systemState.systemResources.memory.percentage = 
      (this.systemState.systemResources.memory.used / this.systemState.systemResources.memory.total) * 100;
    
    this.systemState.systemResources.storage.percentage = 
      (this.systemState.systemResources.storage.used / this.systemState.systemResources.storage.total) * 100;
  }

  getAvailableApps(): OSApp[] {
    return Array.from(this.apps.values());
  }

  getAppById(appId: string): OSApp | undefined {
    return this.apps.get(appId);
  }

  async updateWindow(windowId: string, updates: Partial<OSWindow>): Promise<OSWindow> {
    const window = this.windows.get(windowId);
    if (!window) {
      throw new Error(`Window ${windowId} not found`);
    }

    Object.assign(window, updates);
    
    if (updates.isActive) {
      // Deactivate other windows
      this.windows.forEach(w => {
        if (w.id !== windowId) {
          w.isActive = false;
        }
      });
      window.zIndex = ++this.zIndexCounter;
    }

    // this.eventEmitter.emit('window.updated', window);
    return window;
  }

  async setUser(userId: string, username: string, permissions: string[], isAdmin: boolean): Promise<void> {
    this.systemState.user = {
      id: userId,
      username,
      permissions,
      isAdmin,
    };

    // this.eventEmitter.emit('user.changed', this.systemState.user);
  }

  // App sandboxing - check if app has permission for specific action
  hasAppPermission(appId: string, permission: string): boolean {
    const app = this.apps.get(appId);
    if (!app) return false;
    
    return app.permissions.includes(permission);
  }

  // Resource management
  async killProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);
    if (process) {
      process.status = 'terminated';
      this.processes.delete(processId);
      
      // Close associated app if this was the last process
      const appProcesses = Array.from(this.processes.values()).filter(p => p.appId === process.appId);
      if (appProcesses.length === 0) {
        const app = this.apps.get(process.appId);
        if (app) {
          app.isRunning = false;
          this.apps.set(process.appId, app);
        }
      }

      // this.eventEmitter.emit('process.killed', processId);
    }
  }

  // System control
  async restartSystem(): Promise<void> {
    // Close all apps
    const runningApps = Array.from(this.apps.values()).filter(app => app.isRunning);
    for (const app of runningApps) {
      await this.closeApp(app.id, 'system');
    }

    // Clear all notifications
    this.notifications = [];

    // Reset counters
    this.windowIdCounter = 0;
    this.zIndexCounter = 1000;

    // this.eventEmitter.emit('system.restarted');
    this.logger.log('System restarted');
  }
}