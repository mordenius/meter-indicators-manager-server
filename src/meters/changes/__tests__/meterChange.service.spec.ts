import dotenv from "dotenv";
import { DataSource, DeepPartial } from "typeorm";

import { Meter } from "../../meter.entity";
import { MeterChange } from "../meterChange.entity";
import { MeterChangeService } from "../meterChange.service";

import {
  initializeLogger,
  initializeDataSource
} from "../../../_frameworks/index";

let dataSource: DataSource;

beforeAll(
  async (): Promise<void> => {
    dotenv.config();
    const logger = initializeLogger();
    dataSource = await initializeDataSource(logger, [Meter, MeterChange]);
  }
);

afterAll(
  async (): Promise<void> => {
    await dataSource.destroy();
  }
);

describe("Meter Changes Service", (): void => {
  it("should create a new meter change", async (): Promise<void> => {
    const meterChangeService = new MeterChangeService(dataSource);

    const data: DeepPartial<MeterChange> = {
      previousValue: 0,
      currentValue: 1
    };

    const change = await meterChangeService.create(data);

    expect(change.previousValue).toBe(data.previousValue);
    expect(change.currentValue).toBe(data.currentValue);
  });
});
