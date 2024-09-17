/// <reference lib="webworker" />
import {
    ApplicationBehaviors,
    ApplicationNode, OptionalPromise,
    registerApplicationBehavior,
    ScriptBuilder
} from '@universal-robots/contribution-api';
import { AccessServicesNode } from './access-services.node';

// factory is required
const createApplicationNode = (): OptionalPromise<AccessServicesNode> => ({
    type: 'urcaps-r-us-accessing-services-access-services',    // type is required
    version: '1.0.0'     // version is required
});

// generatePreamble is optional
const generatePreambleScriptCode = (node: AccessServicesNode): OptionalPromise<ScriptBuilder> => {
    const builder = new ScriptBuilder();
    return builder;
};

// upgradeNode is optional
const upgradeApplicationNode
  = (loadedNode: ApplicationNode, defaultNode: AccessServicesNode): AccessServicesNode =>
      defaultNode;

// downgradeNode is optional
const downgradeApplicationNode
  = (loadedNode: ApplicationNode, defaultNode: AccessServicesNode): AccessServicesNode =>
      defaultNode;

const behaviors: ApplicationBehaviors = {
    factory: createApplicationNode,
    generatePreamble: generatePreambleScriptCode,
    upgradeNode: upgradeApplicationNode,
    downgradeNode: downgradeApplicationNode
};

registerApplicationBehavior(behaviors);
