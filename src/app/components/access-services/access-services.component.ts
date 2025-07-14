import { TranslateService } from '@ngx-translate/core';
import { first, take } from 'rxjs/operators';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ApplicationPresenterAPI, ApplicationPresenter, RobotSettings, PayloadLimits, Signal, SignalBooleanValue, SignalEvent } from '@universal-robots/contribution-api';
import { AccessServicesNode } from './access-services.node';
import { Subscription } from 'rxjs';

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

    apiResponse: Promise<number> | null = null;

    private sourceUpdatesSubscription?: Subscription

    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef
    ) {
    }

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
        }
    }

    onButtonPress(): void {
    this.sourceUpdatesSubscription = this.applicationAPI.sourceService
      .getSourceUpdates("ur-robot-io", "ur-tool-io")
      .subscribe({
        next: (event: SignalEvent) => {
          console.log('Received SignalEvent:', event);
        },
        error: (err) => {
          console.error('SourceUpdates Observable errored:', err);
        },
        complete: () => {
          console.log('SourceUpdates Observable completed');
        }
      });
    }

    onDestroyPress(): void {
        if (this.sourceUpdatesSubscription && !this.sourceUpdatesSubscription.closed) {
            this.sourceUpdatesSubscription.unsubscribe();
            console.log('Unsubscribed successfully.');
        }
        else {
            console.log(`No active subscription.`);
            
        } 
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
        this.onDestroyPress();
    }
        


    // call saveNode to save node parameters
    saveNode() {
        this.cd.detectChanges();
        this.applicationAPI.applicationNodeService.updateNode(this.applicationNode);
    }
}
