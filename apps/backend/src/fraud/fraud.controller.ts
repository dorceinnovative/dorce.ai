import { Controller, Get, Put, UseGuards, HttpCode, HttpStatus } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { FraudService } from "./fraud.service"
import { UpdateFraudAlertDto } from "./dto/update-fraud-alert.dto"

@ApiTags("fraud")
@Controller("api/fraud")
export class FraudController {
  constructor(private fraudService: FraudService) {}

  @Get("alerts")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get fraud alerts (admin)" })
  @ApiResponse({ status: 200, description: "Fraud alerts retrieved" })
  async getFraudAlerts() {
    return this.fraudService.getUserFraudAlerts('system')
  }

  @Get("alerts/:alertId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get specific fraud alert (admin)" })
  @ApiResponse({ status: 200, description: "Fraud alert retrieved" })
  async getFraudAlert(alertId: string) {
    return this.fraudService.getFraudAlert(alertId)
  }

  @Put("alerts/:alertId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update fraud alert status (admin)" })
  @ApiResponse({ status: 200, description: "Fraud alert updated" })
  @HttpCode(HttpStatus.OK)
  async updateFraudAlert(alertId: string, dto: UpdateFraudAlertDto) {
    return this.fraudService.resolveFraudAlert(alertId, dto.action || 'Resolved', 'admin')
  }

  @Get("statistics")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get fraud statistics (admin)" })
  @ApiResponse({ status: 200, description: "Fraud statistics retrieved" })
  async getFraudStatistics() {
    return this.fraudService.getFraudStatistics()
  }
}
