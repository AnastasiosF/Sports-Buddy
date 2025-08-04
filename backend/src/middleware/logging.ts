import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Enhanced request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Capture response body for logging
  let responseBody: any;
  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString(),
  });

  // Log sensitive endpoints with additional details
  const sensitiveEndpoints = ['/auth/', '/friends/', '/profiles/'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint));
  
  if (isSensitive) {
    logger.info('Sensitive endpoint accessed', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      hasAuth: !!req.headers.authorization,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    // Log errors with more detail
    if (res.statusCode >= 400) {
      logger.warn('Request failed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        responseSize: res.get('Content-Length'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};

// Performance monitoring middleware
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Log performance metrics for critical endpoints
    const criticalEndpoints = ['/api/matches', '/api/friends', '/api/profiles'];
    const isCritical = criticalEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    if (isCritical) {
      logger.info('Critical endpoint performance', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  next();
};

// Security event logger
export const securityLogger = (event: string, details: any, req?: Request) => {
  logger.warn('Security event', {
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    url: req?.url,
    method: req?.method,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logger
export const dbLogger = (operation: string, table: string, details: any = {}) => {
  logger.info('Database operation', {
    operation,
    table,
    details,
    timestamp: new Date().toISOString(),
  });
};