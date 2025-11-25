import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Track application start time for uptime calculation
const startTime = Date.now()

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    // Calculate uptime
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000)

    // Get memory usage (if available in Node.js)
    const memoryUsage = process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
    } : undefined

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      application: 'healthy',
      timestamp,
      uptime: uptimeSeconds,
      metrics: memoryUsage ? {
        memory: memoryUsage,
      } : undefined,
    })
  } catch (error) {
    // Database connection failed
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        application: 'unhealthy',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

