import { ApplicationNode } from '@universal-robots/contribution-api';

export interface AccessServicesNode extends ApplicationNode {
  type: string;
  version: string;
}
