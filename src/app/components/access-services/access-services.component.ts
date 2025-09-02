import { TranslateService } from '@ngx-translate/core';
import { first, take } from 'rxjs/operators';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges, signal, computed } from '@angular/core';
import { ApplicationPresenterAPI, ApplicationPresenter, RobotSettings, PayloadLimits, Signal, SignalBooleanValue, SignalEvent, SignalFloatValue, SignalAnalogDomain } from '@universal-robots/contribution-api';
import { AccessServicesNode } from './access-services.node';
import { Subscription } from 'rxjs';

// Interface for our signal status display
interface SignalStatus {
  signalID: string;
  type: string;
  value: boolean | number | string;
  lastUpdated: Date;
}

@Component({
    templateUrl: './access-services.component.html',
    styleUrls: ['./access-services.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AccessServicesComponent implements ApplicationPresenter, OnChanges, OnDestroy {
    // applicationAPI is optional
    @Input() applicationAPI: ApplicationPresenterAPI;
    // robotSettings is optional
    @Input() robotSettings: RobotSettings;
    // applicationNode is required
    @Input() applicationNode: AccessServicesNode;

    // Angular Signals for signal status
    private signalStatusMap = signal<Map<string, SignalStatus>>(new Map());
    
    // Computed signal for display-friendly signal list
    signalStatusList = computed(() => {
        const statusMap = this.signalStatusMap();
        return Array.from(statusMap.values()).sort((a, b) => a.signalID.localeCompare(b.signalID));
    });

    // Signal for tracking connection status
    isTrackingSignals = signal<boolean>(false);

    private sourceUpdatesSubscription?: Subscription

    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef
    ) {}


    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.robotSettings) {
            if (!changes?.robotSettings?.currentValue) {
                return;
            }

            if (changes?.robotSettings?.isFirstChange()) {
                if (changes?.robotSettings?.currentValue) {
                    this.translateService.use(changes?.robotSettings?.currentValue?.language);
                }
                this.translateService.setDefaultLang('en');
            }

            this.translateService
                .use(changes?.robotSettings?.currentValue?.language)
                .pipe(first())
                .subscribe(() => {
                    this.cd.detectChanges();
                });
            
            // Start signal tracking when applicationAPI becomes available
            this.startSignalTracking();
            console.log('Started signal tracking');
            
        }
    }

    private startSignalTracking(): void {
        if (!this.applicationAPI || this.sourceUpdatesSubscription) {
            return;
        }

        this.isTrackingSignals.set(true);
        this.sourceUpdatesSubscription = this.applicationAPI.sourceService
            .getSourceUpdates("ur-robot-io", "ur-tool-io")
            .subscribe({
                next: (event: SignalEvent) => {
                    this.updateSignalStatus(event);
                },
                error: (err) => {
                    console.error('SourceUpdates Observable errored:', err);
                    this.isTrackingSignals.set(false);
                },
                complete: () => {
                    console.log('SourceUpdates Observable completed');
                    this.isTrackingSignals.set(false);
                }
            });
    }

    private updateSignalStatus(event: SignalEvent): void {
        const currentMap = new Map(this.signalStatusMap());
        
        let value: boolean | number | string;
        
        // Handle different signal event types
        // Expected signal types by ID:
        // - DO 0, DO 1, DI 0, DI 1: signal_boolean_value only
        // - AI 0, AI 1: signal_float_value AND signal_analog_domain
        switch (event.type) {
            case 'signal_boolean_value':
                value = (event as SignalBooleanValue).value;
                break;
            case 'signal_float_value':
                value = (event as SignalFloatValue).value;
                break;
            case 'signal_analog_domain':
                value = (event as SignalAnalogDomain).value;
                break;
            default:
                value = 'Unknown';
                break;
        }

        // Filter out inappropriate signal types for digital I/O
        const isDigitalIO = event.signalID.startsWith('DO ') || event.signalID.startsWith('DI ');
        if (isDigitalIO && event.type !== 'signal_boolean_value') {
            // Skip float values for digital I/O
            return;
        }

        // For analog inputs, prefer float values over domain values for primary display
        const isAnalogInput = event.signalID.startsWith('AI ');
        const existingSignal = currentMap.get(event.signalID);
        if (isAnalogInput && existingSignal && existingSignal.type === 'signal_float_value' && event.type === 'signal_analog_domain') {
            // Keep the float value as primary, skip domain value
            return;
        }

        const signalStatus: SignalStatus = {
            signalID: event.signalID,
            type: event.type,
            value: value,
            lastUpdated: new Date()
        };

        currentMap.set(event.signalID, signalStatus);
        this.signalStatusMap.set(currentMap);
    }

    clearSignalHistory(): void {
        this.signalStatusMap.set(new Map());
    }

    // Temporary debug methods - remove later
    logSignalStatusMap(): void {
        console.log('signalStatusMap:', this.signalStatusMap());
    }

    logSignalStatusList(): void {
        console.log('signalStatusList:', this.signalStatusList());
    }

    async onWiredPress(): Promise<void> {
      const val: SignalBooleanValue = {
        signalID: 'DO 0',
        type:     'signal_boolean_value',
        value:    true
      };
      await this.applicationAPI.sourceService.setSourceSignalValue(
        'ur-robot-io',
        'ur-wired-io',
        'DO 0',
        val
      );
    }

    async onToolPress(): Promise<void> {
      const val: SignalBooleanValue = {
        signalID: 'DO 0',
        type:     'signal_boolean_value',
        value:    true
      };
      await this.applicationAPI.sourceService.setSourceSignalValue(
        'ur-robot-io',
        'ur-tool-io',
        'DO 0',
        val
      );
    }

    ngOnDestroy(): void {
        console.log('ngOnDestroy was called.')
        if (this.sourceUpdatesSubscription && !this.sourceUpdatesSubscription.closed) {
            this.sourceUpdatesSubscription.unsubscribe();
            console.log('Unsubscribed successfully.');
        }
        this.isTrackingSignals.set(false);
    }

    // call saveNode to save node parameters
    saveNode() {
        this.cd.detectChanges();
        this.applicationAPI.applicationNodeService.updateNode(this.applicationNode);
    }
}
