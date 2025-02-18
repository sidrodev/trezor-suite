import { versionUtils } from '@trezor/utils';
import { Release, VersionArray } from './parse';

export const filterSafeListByBootloader = (
    releasesList: Release[],
    bootloaderVersion: VersionArray,
) =>
    releasesList.filter(
        item =>
            (!item.min_bootloader_version ||
                versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) &&
            (!item.bootloader_version ||
                versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion)),
    );

export const filterSafeListByFirmware = (releasesList: Release[], firmwareVersion: VersionArray) =>
    releasesList.filter(item =>
        versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version),
    );
