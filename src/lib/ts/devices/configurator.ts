import { EventEmitter } from 'events';

import type Manager from '../manager';

import type { Color, LEDCapabilities, LEDModes, LEDZones } from './led';

import type { DPILevels, DPICapabilities } from './dpi';

import type {
  BindTo,
  ButtonBindings,
  ButtonsCapabilities,
  MouseButtonPosition,
} from './buttons';

export type DeviceFilter = Required<
  Pick<HIDDeviceFilter, 'productId' | 'vendorId'>
>;

export enum ConfiguratorEvents {
  CONNECT = 'connected',
  RECEIVED_FIRMWARE_VERSION = 'receivedFirmwareVersion',
}

export abstract class HIDDeviceConfigurator extends EventEmitter {
  // PROPERTIES
  abstract hidDevice: HIDDevice;

  abstract manager: typeof Manager;

  // BASICS
  abstract handleInputReport(e: HIDInputReportEvent): void;

  handleEvent = (event: HIDInputReportEvent): void => {
    switch (event.type) {
      case 'inputreport':
        this.handleInputReport(event);
        break;
      default:
        break;
    }
  };

  open(): Promise<void> {
    this.hidDevice.addEventListener('inputreport', this);

    return this.hidDevice.open();
  }

  close(): Promise<void> {
    this.hidDevice.removeEventListener('inputreport', this);

    return this.hidDevice.close();
  }

  abstract requestFirmwareVersion(): Promise<void>;

  sendReport(reportId: number, outputReport: Uint8Array): Promise<void> {
    return this.hidDevice.sendReport(reportId, outputReport);
  }

  sendFeatureReport(
    reportId: number,
    featureReport: Uint8Array,
  ): Promise<void> {
    return this.hidDevice.sendFeatureReport(reportId, featureReport);
  }

  requestCurrentConfig?(): Promise<void>;

  // RGB
  ledCapabilities?(): LEDCapabilities;

  requestCurrentLedConfig?(): Promise<void[]>;

  ledForZone?(zone: LEDZones): Promise<void>;

  setLed?(color: Color, zone: LEDZones, mode: LEDModes): Promise<void>;

  protected defaultRequestCurrentLedConfig(
    ledCapabilities: LEDCapabilities,
    ledForZone: (zone: LEDZones) => Promise<void>,
  ): Promise<void[]> {
    const zones = Object.keys(ledCapabilities) as LEDZones[];
    return Promise.all(zones.map(zone => ledForZone(zone)));
  }

  // DPI
  dpiCapabilities?(): DPICapabilities;

  requestDPILevels?(): Promise<void>;

  setDPILevel?(level: number, cpi: number): Promise<void>;

  setDPILevels?(levels: DPILevels): Promise<void>;

  // Buttons
  buttonsCapabilities?(): ButtonsCapabilities;

  requestButtons?(): Promise<void>;

  setButton?(
    position: MouseButtonPosition,
    bindType: ButtonBindings,
    bindTo: BindTo,
  ): Promise<void>;

  // Profiles
  requestProfile?(id: number): Promise<void>;
}

export interface HIDDeviceConfiguratorConstructor {
  new (manager: typeof Manager, devices: HIDDevice[]): HIDDeviceConfigurator;
  FILTER: DeviceFilter;
}
