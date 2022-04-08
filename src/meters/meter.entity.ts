import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

import { MeterChange } from "./changes/meterChange.entity";

@Entity("meters")
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
  @JoinTable({
    joinColumn: { name: "meter_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "meter_change_id", referencedColumnName: "id" }
  })
  changes: MeterChange[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ select: false })
  deletedAt?: Date;
}
