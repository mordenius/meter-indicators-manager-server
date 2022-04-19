import { DataSource, DeepPartial, Repository } from "typeorm";
import { Tool } from "../../../_common";

import { MeterChange } from "./meterChange.entity";

export class MeterChangesService {
  private readonly repository: Repository<MeterChange>;

  constructor(@Tool("dataSource") dataSource: DataSource) {
    this.repository = dataSource.getRepository(MeterChange);
  }

  async create(data: DeepPartial<MeterChange>): Promise<MeterChange> {
    const meter = this.repository.create(data);
    return this.repository.save(meter);
  }
}
