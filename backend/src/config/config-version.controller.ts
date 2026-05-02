import { Controller, Get } from '@nestjs/common';
import { ORACLE_RULES_VERSION } from './oracle-rules-version';

@Controller('config')
export class ConfigVersionController {
  @Get('version')
  version(): { version: string } {
    return { version: ORACLE_RULES_VERSION };
  }
}
