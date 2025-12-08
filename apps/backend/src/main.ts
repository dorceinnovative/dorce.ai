import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { ValidationPipe } from "@nestjs/common"
import { AppModule } from "./app.module"

const buildTarget = process.env.BUILD_TARGET
let AppBootstrapModule = AppModule

// Dynamic import for conditional module loading
if (buildTarget === 'nin') {
  try {
     
    const { AppNinModule } = require('./app.nin.module')
    AppBootstrapModule = AppNinModule
  } catch (error) {
    console.warn('AppNinModule not found, falling back to AppModule')
  }
}

async function bootstrap() {
  try {
    console.log('🚀 Starting Dorce.ai Backend...')
    
    const app = await NestFactory.create(AppBootstrapModule)

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Temporarily disable to allow proper field mapping
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )

    // Enable CORS
    app.enableCors({
      origin: (origin, callback) => {
        const allowed = process.env.FRONTEND_URL || ''
        const list = (process.env.CORS_ORIGINS || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        const allowlist = new Set([allowed, ...list].filter(Boolean))
        if (allowlist.size === 0) return callback(null, true)
        return callback(null, allowlist.has(origin || '') ? true : false)
      },
      credentials: true,
    })

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle("Dorce.ai API")
      .setDescription("API documentation for Dorce.ai fintech platform")
      .setVersion("1.0.0")
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup("api/docs", app, document)

    const port = process.env.PORT || 4000
    const publicUrl = process.env.PUBLIC_BACKEND_URL
    await app.listen(port)
    console.log(`✅ Application is running on port ${port}`)
    if (publicUrl) {
      console.log(`🌐 Public URL: ${publicUrl}`)
      console.log(`📚 API Documentation: ${publicUrl}/api/docs`)
      console.log(`🏥 Health Check: ${publicUrl}/health`)
    } else {
      console.log(`📚 API Documentation path: /api/docs`)
      console.log(`🏥 Health Check path: /health`)
    }
  } catch (error) {
    console.error('❌ Failed to start application:', error)
    process.exit(1)
  }
}

bootstrap()
