import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

import { MeterChange } from "./changes/meterChange.entity";

@Entity()
export class Meter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  uuid: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  currentValue: number;

  @OneToMany(
    () => MeterChange,
    change => change.meter
  )
  changes: MeterChange[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ select: false })
  deletedAt?: Date;
}
