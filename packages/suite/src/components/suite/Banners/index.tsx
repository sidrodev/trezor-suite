import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { isDesktop } from '@suite-utils/env';
import { isTranslationMode } from '@suite-utils/l10n';
import { useSelector } from '@suite-hooks';
import { useMessageSystem } from '@suite-hooks/useMessageSystem';
import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';
import FailedBackup from './FailedBackup';
import MessageSystemBanner from './MessageSystemBanner';
import SafetyChecksBanner from './SafetyChecks';
import TranslationMode from './TranslationMode';
import { useGuide } from '@guide-hooks';

const Wrapper = styled.div<{ isOnTop?: boolean; guideOpen?: boolean; isModalOpen?: boolean }>`
    z-index: ${props =>
        props.isOnTop ? variables.Z_INDEX.BANNER_ON_TOP : variables.Z_INDEX.BANNER};
    transition: all 0.3s;
    background: ${props => props.theme.BG_WHITE};
    margin-right: ${props =>
        props.guideOpen && props.isModalOpen ? variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH : 0};
`;

const Banners = () => {
    const { guideOpen, isModalOpen } = useGuide();

    const { transport, device, online } = useSelector(state => ({
        transport: state.suite.transport,
        device: state.suite.device,
        online: state.suite.online,
    }));

    const { banner: messageSystemBanner } = useMessageSystem();

    // The dismissal doesn't need to outlive the session. Use local state.
    const [safetyChecksDismissed, setSafetyChecksDismissed] = useState(false);
    useEffect(() => {
        setSafetyChecksDismissed(false);
    }, [device?.features?.safety_checks]);

    const showUpdateBridge = () => {
        if (
            isDesktop() &&
            transport?.version &&
            ['2.0.27', '2.0.28', '2.0.29'].includes(transport.version)
        ) {
            return false;
        }
        return transport?.outdated;
    };

    let banner;
    let priority = 0;
    if (device?.features?.unfinished_backup) {
        banner = <FailedBackup />;
        priority = 90;
    } else if (device?.features?.needs_backup) {
        banner = <NoBackup />;
        priority = 70;
    } else if (device?.connected && device?.features?.safety_checks === 'PromptAlways') {
        // PromptAlways could only be set via trezorctl. Warn user unconditionally.
        banner = <SafetyChecksBanner />;
        priority = 50;
    } else if (
        !safetyChecksDismissed &&
        device?.connected &&
        device?.features?.safety_checks === 'PromptTemporarily'
    ) {
        // PromptTemporarily was probably set intentionally via Suite and will change back to Strict when Trezor reboots.
        // Let the user dismiss the warning.
        banner = <SafetyChecksBanner onDismiss={() => setSafetyChecksDismissed(true)} />;
        priority = 50;
    } else if (showUpdateBridge()) {
        banner = <UpdateBridge />;
        priority = 30;
    } else if (
        device?.connected &&
        device?.features &&
        device?.mode !== 'bootloader' &&
        ['outdated'].includes(device.firmware)
    ) {
        banner = <UpdateFirmware />;
        priority = 10;
    }

    // message system banners should always be visible in the app even if app body is blurred
    const useMessageSystemBanner = messageSystemBanner && messageSystemBanner.priority >= priority;

    return (
        <>
            {useMessageSystemBanner && (
                <Wrapper isOnTop guideOpen={guideOpen} isModalOpen={isModalOpen}>
                    {/* @ts-ignore - fix ts which thinks that "messageSystemBanner" can be null */}
                    <MessageSystemBanner message={messageSystemBanner} />
                </Wrapper>
            )}
            <Wrapper guideOpen={guideOpen} isModalOpen={isModalOpen}>
                {isTranslationMode() && <TranslationMode />}
                <OnlineStatus isOnline={online} />
                {!useMessageSystemBanner && banner}
                {/* TODO: add Pin not set */}
            </Wrapper>
        </>
    );
};

export default Banners;
