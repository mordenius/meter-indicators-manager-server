import { DataSource, DeepPartial, Repository } from "typeorm";
import { Tool } from "../../_frameworks";

import { MeterChange } from "./meterChange.entity";

export class MeterChangeService {
  private readonly repository: Repository<MeterChange>;

  constructor(@Tool("dataSource") dataSource: DataSource) {
    this.repository = dataSource.getRepository(MeterChange);
  }

  async create(data: DeepPartial<MeterChange>): Promise<MeterChange> {
    const meter = this.repository.create(data);
    return this.repository.save(meter);
  }
}
