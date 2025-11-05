import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  permissions: string[];
  profile: {
    firstName?: string;
    lastName?: string;
    department?: string;
    phoneNumber?: string;
  };
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    twoFactorEnabled: boolean;
  };
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  message?: string;
  requiresTwoFactor?: boolean;
}

export interface LoginAttempt {
  ip: string;
  username: string;
  timestamp: string;
  success: boolean;
  userAgent?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'failed_login' | 'token_refresh' | 'permission_change';
  userId?: string;
  username?: string;
  ip: string;
  timestamp: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  username: string;
  ip: string;
  userAgent?: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

export class EnterpriseAuthService {
  private users: Map<string, User> = new Map();
  private blacklistedTokens: Set<string> = new Set();
  private refreshTokens: Map<string, string> = new Map(); // refreshToken -> userId
  private activeSessions: Map<string, SessionInfo> = new Map();
  private loginAttempts: LoginAttempt[] = [];
  private securityEvents: SecurityEvent[] = [];
  private jwtSecret: string;
  private refreshSecret: string;
  private securityDir: string;
  private maxLoginAttempts: number = 5;
  private lockoutDuration: number = 15 * 60 * 1000; // 15 minutes
  private lockedAccounts: Map<string, number> = new Map(); // username -> lockout expiry

  constructor(securityDir: string = './security') {
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || this.generateSecureSecret();
    this.securityDir = securityDir;
    this.initializeSecurityDirectory();
    this.initializeDefaultUser();
    this.startCleanupTasks();
  }

  private async initializeSecurityDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.securityDir, { recursive: true });
      await fs.mkdir(path.join(this.securityDir, 'logs'), { recursive: true });
      console.log(`🔐 Security directory initialized at: ${this.securityDir}`);
    } catch (error) {
      console.error('Error creating security directory:', error);
    }
  }

  private generateSecureSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private async initializeDefaultUser(): Promise<void> {
    try {
      const defaultAdmin: User = {
        id: crypto.randomUUID(),
        username: 'admin',
        email: 'admin@company.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
        permissions: ['*'], // All permissions
        profile: {
          firstName: 'System',
          lastName: 'Administrator',
          department: 'IT'
        },
        settings: {
          theme: 'dark',
          notifications: true,
          twoFactorEnabled: false
        }
      };

      const hashedPassword = await bcrypt.hash('admin123', 12);
      await this.createUserInternal(defaultAdmin, hashedPassword);
      
      console.log('🔐 Default admin user initialized');
    } catch (error) {
      console.error('Error initializing default user:', error);
    }
  }

  async authenticate(
    username: string, 
    password: string, 
    ip: string = 'unknown',
    userAgent?: string
  ): Promise<AuthResult> {
    const attempt: LoginAttempt = {
      ip,
      username,
      timestamp: new Date().toISOString(),
      success: false,
      userAgent
    };

    try {
      // Check if account is locked
      if (this.isAccountLocked(username)) {
        await this.logSecurityEvent('failed_login', undefined, username, ip, {
          reason: 'account_locked',
          userAgent
        }, 'high');
        
        this.loginAttempts.push(attempt);
        return { 
          success: false, 
          message: 'Account is temporarily locked due to too many failed attempts' 
        };
      }

      const user = Array.from(this.users.values()).find(u => u.username === username);
      
      if (!user || !user.isActive) {
        await this.logSecurityEvent('failed_login', undefined, username, ip, {
          reason: user ? 'account_inactive' : 'user_not_found',
          userAgent
        }, 'medium');
        
        this.loginAttempts.push(attempt);
        this.handleFailedLogin(username);
        return { success: false, message: 'Invalid credentials' };
      }

      // Get stored password hash
      const storedHash = await this.getPasswordHash(user.id);
      const isPasswordValid = await bcrypt.compare(password, storedHash);
      
      if (!isPasswordValid) {
        await this.logSecurityEvent('failed_login', user.id, username, ip, {
          reason: 'invalid_password',
          userAgent
        }, 'medium');
        
        this.loginAttempts.push(attempt);
        this.handleFailedLogin(username);
        return { success: false, message: 'Invalid credentials' };
      }

      // Successful login
      attempt.success = true;
      this.loginAttempts.push(attempt);
      this.clearFailedAttempts(username);

      // Update last login
      user.lastLogin = new Date().toISOString();
      
      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      
      // Create session
      const sessionId = crypto.randomUUID();
      const session: SessionInfo = {
        sessionId,
        userId: user.id,
        username: user.username,
        ip,
        userAgent,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      this.activeSessions.set(sessionId, session);
      
      await this.logSecurityEvent('login', user.id, username, ip, {
        sessionId,
        userAgent
      }, 'low');

      // Remove sensitive data
      const { ...safeUser } = user;
      
      return { 
        success: true, 
        user: safeUser, 
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Authentication error:', error);
      await this.logSecurityEvent('failed_login', undefined, username, ip, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent
      }, 'high');
      
      this.loginAttempts.push(attempt);
      return { success: false, message: 'Authentication failed' };
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'user' | 'manager';
    firstName?: string;
    lastName?: string;
    department?: string;
    permissions?: string[];
  }): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(
        u => u.username === userData.username || u.email === userData.email
      );

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Validate password strength
      if (!this.validatePasswordStrength(userData.password)) {
        return { 
          success: false, 
          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        };
      }

      const userId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const newUser: User = {
        id: userId,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        createdAt: new Date().toISOString(),
        isActive: true,
        permissions: userData.permissions || this.getDefaultPermissions(userData.role || 'user'),
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          department: userData.department
        },
        settings: {
          theme: 'light',
          notifications: true,
          twoFactorEnabled: false
        }
      };

      await this.createUserInternal(newUser, hashedPassword);

      // Remove sensitive data
      const { ...safeUser } = newUser;
      
      console.log(`👤 User created: ${userData.username} (${userData.role})`);
      return { success: true, user: safeUser };
    } catch (error) {
      console.error('User creation error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      if (this.blacklistedTokens.has(token)) {
        return null;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = this.users.get(decoded.userId);
      
      if (!user || !user.isActive) {
        return null;
      }

      // Update session activity
      const session = Array.from(this.activeSessions.values()).find(s => s.userId === user.id);
      if (session) {
        session.lastActivity = new Date().toISOString();
      }

      // Remove sensitive data
      const { ...safeUser } = user;
      return safeUser;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string } | null> {
    try {
      const userId = this.refreshTokens.get(refreshToken);
      if (!userId) {
        return null;
      }

      const user = this.users.get(userId);
      if (!user || !user.isActive) {
        this.refreshTokens.delete(refreshToken);
        return null;
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      await this.logSecurityEvent('token_refresh', user.id, user.username, 'system', {
        oldTokenHash: this.hashToken(refreshToken),
        newTokenHash: this.hashToken(newRefreshToken)
      }, 'low');

      return { 
        token: newAccessToken, 
        refreshToken: newRefreshToken 
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  async logout(token: string, ip: string = 'unknown'): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = this.users.get(decoded.userId);
      
      if (user) {
        await this.logSecurityEvent('logout', user.id, user.username, ip, {
          tokenHash: this.hashToken(token)
        }, 'low');
      }

      // Blacklist the token
      this.blacklistedTokens.add(token);
      
      // Remove associated sessions
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === decoded.userId) {
          this.activeSessions.delete(sessionId);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string, 
    ip: string = 'unknown'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const currentHash = await this.getPasswordHash(userId);
      const isCurrentValid = await bcrypt.compare(currentPassword, currentHash);
      
      if (!isCurrentValid) {
        await this.logSecurityEvent('password_change', userId, user.username, ip, {
          result: 'failed',
          reason: 'invalid_current_password'
        }, 'medium');
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password
      if (!this.validatePasswordStrength(newPassword)) {
        return { 
          success: false, 
          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        };
      }

      // Hash and store new password
      const newHash = await bcrypt.hash(newPassword, 12);
      await this.setPasswordHash(userId, newHash);

      await this.logSecurityEvent('password_change', userId, user.username, ip, {
        result: 'success'
      }, 'low');

      console.log(`🔒 Password changed for user: ${user.username}`);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  async getSecurityDashboard(): Promise<{
    totalUsers: number;
    activeUsers: number;
    lockedAccounts: number;
    activeSessions: number;
    recentLoginAttempts: LoginAttempt[];
    securityEvents: SecurityEvent[];
    systemHealth: {
      tokenBlacklist: number;
      refreshTokens: number;
      memoryUsage: string;
    };
  }> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
      lockedAccounts: Array.from(this.lockedAccounts.values()).filter(expiry => expiry > now).length,
      activeSessions: this.activeSessions.size,
      recentLoginAttempts: this.loginAttempts.filter(
        attempt => new Date(attempt.timestamp).getTime() > oneHourAgo
      ).slice(-50),
      securityEvents: this.securityEvents.filter(
        event => new Date(event.timestamp).getTime() > oneDayAgo
      ).slice(-100),
      systemHealth: {
        tokenBlacklist: this.blacklistedTokens.size,
        refreshTokens: this.refreshTokens.size,
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      }
    };
  }

  // Private helper methods
  private async createUserInternal(user: User, passwordHash: string): Promise<void> {
    this.users.set(user.id, user);
    await this.setPasswordHash(user.id, passwordHash);
  }

  private async getPasswordHash(userId: string): Promise<string> {
    // In production, this would be stored in a secure database
    // For now, using file system (not recommended for production)
    try {
      const hashPath = path.join(this.securityDir, `${userId}.hash`);
      return await fs.readFile(hashPath, 'utf-8');
    } catch {
      throw new Error('Password hash not found');
    }
  }

  private async setPasswordHash(userId: string, hash: string): Promise<void> {
    const hashPath = path.join(this.securityDir, `${userId}.hash`);
    await fs.writeFile(hashPath, hash, { mode: 0o600 }); // Read/write for owner only
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        permissions: user.permissions 
      },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  private generateRefreshToken(user: User): string {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    this.refreshTokens.set(refreshToken, user.id);
    return refreshToken;
  }

  private validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
  }

  private getDefaultPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['*'];
      case 'manager':
        return ['read', 'write', 'manage_users', 'view_reports'];
      case 'user':
      default:
        return ['read', 'write'];
    }
  }

  private isAccountLocked(username: string): boolean {
    const lockExpiry = this.lockedAccounts.get(username);
    if (!lockExpiry) return false;
    
    if (Date.now() > lockExpiry) {
      this.lockedAccounts.delete(username);
      return false;
    }
    
    return true;
  }

  private handleFailedLogin(username: string): void {
    const recentAttempts = this.loginAttempts.filter(
      attempt => attempt.username === username && 
                 !attempt.success &&
                 Date.now() - new Date(attempt.timestamp).getTime() < this.lockoutDuration
    );

    if (recentAttempts.length >= this.maxLoginAttempts) {
      this.lockedAccounts.set(username, Date.now() + this.lockoutDuration);
      console.warn(`🔒 Account locked: ${username} (too many failed attempts)`);
    }
  }

  private clearFailedAttempts(username: string): void {
    this.lockedAccounts.delete(username);
  }

  private async logSecurityEvent(
    type: SecurityEvent['type'],
    userId: string | undefined,
    username: string | undefined,
    ip: string,
    details: any,
    severity: SecurityEvent['severity']
  ): Promise<void> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      userId,
      username,
      ip,
      timestamp: new Date().toISOString(),
      details,
      severity
    };

    this.securityEvents.push(event);

    // Keep only last 10000 events in memory
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    // Log to file for persistence
    try {
      const logPath = path.join(this.securityDir, 'logs', `security-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = JSON.stringify(event) + '\n';
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  private startCleanupTasks(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (new Date(session.expiresAt).getTime() < now) {
          this.activeSessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000);

    // Clean up old login attempts every hour
    setInterval(() => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      this.loginAttempts = this.loginAttempts.filter(
        attempt => new Date(attempt.timestamp).getTime() > cutoff
      );
    }, 60 * 60 * 1000);

    console.log('🔧 Security cleanup tasks started');
  }
}

export const enterpriseAuthService = new EnterpriseAuthService();