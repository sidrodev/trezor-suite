/* eslint-disable @typescript-eslint/naming-convention */

import { MiddlewareAPI } from 'redux';
import { TRANSPORT, DEVICE } from 'trezor-connect';

import { SUITE, ROUTER, ANALYTICS } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as analyticsActions from '@suite-actions/analyticsActions';
import {
    getScreenWidth,
    getScreenHeight,
    getBrowserName,
    getBrowserVersion,
    getOsName,
    getOsVersion,
    getWindowWidth,
    getWindowHeight,
    getPlatformLanguages,
} from '@suite-utils/env';
import { isBitcoinOnly, getPhysicalDeviceCount } from '@suite-utils/device';
import { allowSentryReport } from '@suite/utils/suite/sentry';

import type { AppState, Action, Dispatch } from '@suite-types';

const reportSuiteReadyAction = (state: AppState) =>
    analyticsActions.report({
        type: 'suite-ready',
        payload: {
            language: state.suite.settings.language,
            enabledNetworks: state.wallet.settings.enabledNetworks,
            localCurrency: state.wallet.settings.localCurrency,
            discreetMode: state.wallet.settings.discreetMode,
            screenWidth: getScreenWidth(),
            screenHeight: getScreenHeight(),
            platformLanguages: getPlatformLanguages().join(','),
            tor: state.suite.tor,
            rememberedStandardWallets: state.devices.filter(d => d.remember && d.useEmptyPassphrase)
                .length,
            rememberedHiddenWallets: state.devices.filter(d => d.remember && !d.useEmptyPassphrase)
                .length,
            theme: state.suite.settings.theme.variant,
            suiteVersion: process.env.VERSION || '',
            earlyAccessProgram: state.desktopUpdate.allowPrerelease,
            browserName: getBrowserName(),
            browserVersion: getBrowserVersion(),
            osName: getOsName(),
            osVersion: getOsVersion(),
            windowWidth: getWindowWidth(),
            windowHeight: getWindowHeight(),
        },
    });

/*
    In analytics middleware we may intercept actions we would like to log. For example:
    - trezor model
    - firmware version
    - transport (webusb/bridge) and its version
    - backup type (shamir/bip39)
*/
const analytics =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevRouterUrl = api.getState().router.url;
        // pass action
        next(action);

        const state = api.getState();

        switch (action.type) {
            case ANALYTICS.INIT:
                // reporting can start when analytics is properly initialized and enabled
                api.dispatch(reportSuiteReadyAction(state));
                break;
            case ANALYTICS.ENABLE:
                if (state.suite.flags.initialRun) {
                    // suite-ready event was not reported on analytics initialization because analytics was not yet confirmed
                    api.dispatch(reportSuiteReadyAction(state));
                }
                api.dispatch(analyticsActions.report({ type: 'analytics/enable' }));
                allowSentryReport(true);
                break;
            case ANALYTICS.DISPOSE:
                api.dispatch(analyticsActions.report({ type: 'analytics/dispose' }, true));
                allowSentryReport(false);
                break;
            case TRANSPORT.START:
                api.dispatch(
                    analyticsActions.report({
                        type: 'transport-type',
                        payload: {
                            type: action.payload.type,
                            version: action.payload.version,
                        },
                    }),
                );
                break;
            case DEVICE.CONNECT: {
                const { features, mode } = action.payload;
                const isBtcOnly = isBitcoinOnly(action.payload);
                if (features && mode !== 'bootloader') {
                    api.dispatch(
                        analyticsActions.report({
                            type: 'device-connect',
                            payload: {
                                mode,
                                firmware: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
                                backup_type: features.backup_type || 'Bip39',
                                pin_protection: features.pin_protection,
                                passphrase_protection: features.passphrase_protection,
                                totalInstances: state.devices.length,
                                isBitcoinOnly: isBtcOnly,
                                totalDevices: getPhysicalDeviceCount(state.devices),
                                language: features.language,
                                model: features.model,
                            },
                        }),
                    );
                } else {
                    api.dispatch(
                        analyticsActions.report({
                            type: 'device-connect',
                            payload: {
                                mode: 'bootloader',
                            },
                        }),
                    );
                }
                break;
            }
            case DEVICE.DISCONNECT:
                api.dispatch(analyticsActions.report({ type: 'device-disconnect' }));
                break;
            case DISCOVERY.COMPLETE: {
                const accountsStatus = state.wallet.accounts
                    .filter(account => account.history.total + (account.history.unconfirmed || 0))
                    .reduce((acc: { [key: string]: number }, obj) => {
                        const id = `${obj.symbol}_${obj.accountType}`;
                        acc[id] = (acc[id] || 0) + 1;
                        return acc;
                    }, {});

                api.dispatch(
                    analyticsActions.report({
                        type: 'accounts/status',
                        payload: { ...accountsStatus },
                    }),
                );
                break;
            }
            case ROUTER.LOCATION_CHANGE:
                api.dispatch(
                    analyticsActions.report({
                        type: 'router/location-change',
                        payload: {
                            prevRouterUrl,
                            nextRouterUrl: action.payload.url,
                        },
                    }),
                );
                break;
            case SUITE.AUTH_DEVICE:
                api.dispatch(
                    analyticsActions.report({
                        type: 'select-wallet-type',
                        payload: { type: action.payload.walletNumber ? 'hidden' : 'standard' },
                    }),
                );
                break;
            case SUITE.TOR_STATUS:
                api.dispatch(
                    analyticsActions.report({
                        type: 'menu/toggle-tor',
                        payload: {
                            value: action.payload,
                        },
                    }),
                );
                break;
            default:
                break;
        }
        return action;
    };

export default analytics;
