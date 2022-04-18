import {
  DataSource,
  DeepPartial,
  Repository,
  ILike,
  FindOperator
} from "typeorm";
import { Inject, Tool, Logger } from "../_frameworks";

import { Meter } from "./meter.entity";
import { MeterChangesService } from "./changes/meterChanges.service";
import { query } from "winston";

export class MetersService {
  private readonly repository: Repository<Meter>;
  private readonly relations = ["changes"];
  private readonly searchBy = ["name", "id"];

  constructor(
    @Tool("dataSource") dataSource: DataSource,
    @Tool("logger") logger: Logger,
    @Inject(MeterChangesService)
    private readonly meterChangeService: MeterChangesService
  ) {
    this.repository = dataSource.getRepository(Meter);
  }

  async findAll({
    limit,
    page
  }: {
    limit: number;
    page: number;
  }): Promise<[Meter[], number]> {
    return Promise.all([
      this.repository.find({
        relations: this.relations,
        take: limit,
        skip: (page - 1) * limit,
        withDeleted: false,
      }),
      this.repository.count()
    ]);
  }

  search({
    search,
    limit,
    page
  }: {
    search: string;
    limit: number;
    page: number;
  }): Promise<[Meter[], number]> {
    const whereCondition = this.searchBy.reduce(
      (query, field) => [...query, { [field]: ILike(`%${search}%`) }],
      [] as { [key: string]: FindOperator<string> }[]
    );

    return this.repository
      .createQueryBuilder()
      .where(whereCondition)
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();
  }

  findOne(id: number): Promise<Meter | null> {
    return this.repository.findOne({
      where: { id },
      relations: this.relations,
      withDeleted: false,
    });
  }

  create(data: DeepPartial<Meter>): Promise<Meter>;
  create(data: DeepPartial<Meter>[]): Promise<Meter[]>;
  async create(
    data: DeepPartial<Meter> | DeepPartial<Meter>[]
  ): Promise<Meter | Meter[]> {
    const meter = this.repository.create(
      data as DeepPartial<Meter> & DeepPartial<Meter>[]
    );
    return this.repository.save(meter);
  }

  async update(
    id: number,
    { name, currentValue }: DeepPartial<Meter>
  ): Promise<Meter> {
    const meter = await this.repository.findOneBy({ id });

    if (meter == null) {
      throw new Error(`Meter #${id} not found`);
    }

    meter.currentValue = currentValue || meter.currentValue;
    meter.name = name || meter.name;

    await Promise.all([
      this.repository.save(meter),
      this.meterChangeService.create({
        meter: meter,
        previousValue: 0,
        currentValue: currentValue
      })
    ]);

    return meter;
  }

  async remove(id: number): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
