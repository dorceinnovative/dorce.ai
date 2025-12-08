import { Test, type TestingModule } from "@nestjs/testing"
import { AuthService } from "./auth.service"
import { PrismaService } from "../prisma/prisma.service"
import { JwtService } from "@nestjs/jwt"
import { UsersService } from "../users/users.service"
import { jest } from "@jest/globals" // Declare the jest variable

describe("AuthService", () => {
  let service: AuthService
  let prismaService: PrismaService

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  }

  const mockUsersService = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  it("should register a new user", async () => {
    const registerDto = {
      email: "test@example.com",
      phone: "+234812345678",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    }

    mockPrismaService.user.findFirst.mockResolvedValueOnce(null)
    mockPrismaService.user.create.mockResolvedValueOnce({
      id: "1",
      ...registerDto,
      role: "USER",
    })
    mockJwtService.sign.mockReturnValue("token")

    const result = await service.register(registerDto)

    expect(result).toHaveProperty("accessToken")
    expect(result).toHaveProperty("refreshToken")
    expect(result).toHaveProperty("user")
  })
})
