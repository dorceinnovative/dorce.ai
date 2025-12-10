import { Controller, Post, Get, Body, UseGuards } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { PrismaService } from "../prisma/prisma.service"
import { CurrentUser } from "../auth/decorators/current-user.decorator"

@ApiTags("kyc")
@Controller("api/kyc")
export class KycController {
  constructor(private prisma: PrismaService) {}

  @Post("submit")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit KYC information" })
  @ApiResponse({ status: 200, description: "KYC submitted" })
  async submit(
    @CurrentUser() userId: string,
    @Body() body: any,
  ) {
    const {
      role,
      bvn,
      nin,
      idType,
      selfie,
      idPhoto,
      corpName,
      cacNumber,
    } = body || {}

    await this.prisma.kYC.upsert({
      where: { userId },
      update: {
        bvn: bvn || undefined,
        nin: nin || undefined,
        documentType: idType || undefined,
        status: "PENDING",
        updatedAt: new Date(),
      },
      create: {
        userId,
        bvn: bvn || undefined,
        nin: nin || undefined,
        documentType: idType || undefined,
        status: "PENDING",
      },
    })

    // Save documents if provided (base64 data URLs)
    const docs: Array<{ fileName: string; dataUrl?: string; type: string }> = []
    if (idPhoto && typeof idPhoto === "string") {
      docs.push({ fileName: "government-id.png", dataUrl: idPhoto, type: "GOVERNMENT_ID" })
    }
    if (selfie && typeof selfie === "string") {
      docs.push({ fileName: "selfie.png", dataUrl: selfie, type: "OTHER" })
    }

    for (const d of docs) {
      const size = d.dataUrl ? Buffer.byteLength(d.dataUrl, "utf8") : 0
      await this.prisma.document.create({
        data: {
          userId,
          type: d.type as any,
          fileName: d.fileName,
          fileUrl: d.dataUrl || "",
          fileSize: size,
          mimeType: "image/png",
          status: "PENDING",
        },
      })
    }

    // For business role, record a verification placeholder
    if (role === "business" && cacNumber) {
      await this.prisma.verification.create({
        data: {
          userId,
          type: "EMPLOYMENT",
          provider: "internal",
          status: "PENDING",
          reference: cacNumber,
        },
      })
    }

    return { status: "PENDING" }
  }

  @Get("status")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get KYC status" })
  async status(@CurrentUser() userId: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } })
    return { status: kyc?.status || "PENDING", kyc }
  }
}

