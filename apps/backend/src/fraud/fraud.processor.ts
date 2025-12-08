import { Process, Processor } from "@nestjs/bull"
import type { Job } from "bull"
import { FraudService, FraudCheckData } from "./fraud.service"

@Processor("fraud-detection")
export class FraudProcessor {
  constructor(private fraudService: FraudService) {}

  @Process()
  async processFraudCheck(job: Job<FraudCheckData>) {
    return this.fraudService.performFraudCheck(job.data)
  }
}
