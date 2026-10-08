/**
 * BIFA 2 schema. Table and column names follow the legacy `bifa` database so the
 * stock and report SQL stays comparable with the legacy SQL. Renames and dropped
 * columns are documented in scripts/lib/migrate-data.ts.
 */
import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core'

export const STARI = ['activ', 'inactiv'] as const
export const ROLURI = ['admin', 'operator'] as const
export const TIPURI_MATERIAL = ['M', 'OB', 'MF'] as const
export const STARI_MATERIAL = ['NOU', 'FOLOSIT', 'CASARE'] as const
export const TIPURI_DOCUMENT = ['i', 'e', 't'] as const

const timestamps = {
  created_at: datetime('created_at', { mode: 'string' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
}

const stare = () => mysqlEnum('stare', STARI).notNull().default('activ')

export const utilizatori = mysqlTable('utilizatori', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique('utilizatori_username_unique'),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  rol: mysqlEnum('rol', ROLURI).notNull().default('operator'),
  stare: stare(),
  ...timestamps,
})

export const gestiuni = mysqlTable('gestiuni', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  denumire: varchar('denumire', { length: 255 }).notNull(),
  userid: int('userid', { unsigned: true }).references(() => utilizatori.id),
  gestionar: varchar('gestionar', { length: 70 }),
  r_presedinte: varchar('r_presedinte', { length: 255 }),
  r_membru1: varchar('r_membru1', { length: 255 }),
  r_membru2: varchar('r_membru2', { length: 255 }),
  r_membru3: varchar('r_membru3', { length: 255 }),
  i_presedinte: varchar('i_presedinte', { length: 255 }),
  i_membru1: varchar('i_membru1', { length: 255 }),
  i_membru2: varchar('i_membru2', { length: 255 }),
  i_membru3: varchar('i_membru3', { length: 255 }),
  stare: stare(),
  ...timestamps,
})

/** Chart of accounts. Analytic accounts created by users have tip = 'N'. */
export const conturi = mysqlTable('conturi', {
  id: int('id').autoincrement().primaryKey(),
  cont: varchar('cont', { length: 35 }).notNull(),
  tip: varchar('tip', { length: 1 }).notNull(),
  denumire: varchar('denumire', { length: 120 }).notNull(),
  sintetic: varchar('sintetic', { length: 35 }),
  nivel: tinyint('nivel').notNull(),
  ...timestamps,
}, t => [index('conturi_cont_idx').on(t.cont)])

export const categorii = mysqlTable('categorii', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  denumire: varchar('denumire', { length: 255 }).notNull(),
  idgestiune: int('idgestiune', { unsigned: true }).notNull().references(() => gestiuni.id),
  tipmaterial: mysqlEnum('tipmaterial', TIPURI_MATERIAL).notNull().default('M'),
  idcont: int('idcont').references(() => conturi.id),
  idcontchelt: int('idcontchelt').references(() => conturi.id),
  info: varchar('info', { length: 255 }),
  /**
   * Created by the importer for lines that referenced a missing category (legacy id_categ = 0).
   * Legacy reports select "all categories" with `id_categ >= 1`, so these lines were never in a
   * report total; "Toate categoriile" keeps that meaning and excludes them, while the category
   * can still be selected explicitly.
   */
  lipsa_import: boolean('lipsa_import').notNull().default(false),
  stare: stare(),
  ...timestamps,
}, t => [index('categorii_gestiune_idx').on(t.idgestiune, t.tipmaterial)])

export const locuri = mysqlTable('locuri', {
  id: int('id').autoincrement().primaryKey(),
  denumire: varchar('denumire', { length: 45 }).notNull(),
  stare: stare(),
  prioritate: int('prioritate').notNull().default(1),
  ...timestamps,
})

export const materiale = mysqlTable('materiale', {
  id: int('id').autoincrement().primaryKey(),
  denumire: varchar('denumire', { length: 100 }).notNull(),
  um: varchar('um', { length: 15 }).notNull().default('buc'),
  pretpredefinit: decimal('pretpredefinit', { precision: 14, scale: 4 }).notNull().default('0.0000'),
  idgestiune: int('idgestiune', { unsigned: true }).notNull().references(() => gestiuni.id),
  iduser: int('iduser', { unsigned: true }).notNull().references(() => utilizatori.id),
  cod_import: varchar('cod_import', { length: 45 }),
  stare: stare(),
  ...timestamps,
}, t => [index('materiale_gestiune_denumire_idx').on(t.idgestiune, t.denumire)])

export const tipuridocumente = mysqlTable('tipuridocumente', {
  id: int('id').autoincrement().primaryKey(),
  denumire: varchar('denumire', { length: 45 }).notNull(),
  tip: mysqlEnum('tip', TIPURI_DOCUMENT).notNull(),
  denumire_scurta: varchar('denumire_scurta', { length: 15 }).notNull(),
  prioritate: int('prioritate'),
  ...timestamps,
})

/** Document headers. */
export const operatiuni = mysqlTable('operatiuni', {
  id: int('id').autoincrement().primaryKey(),
  idtipoperatiuni: int('idtipoperatiuni').notNull().references(() => tipuridocumente.id),
  data: date('data', { mode: 'string' }).notNull(),
  nrdoc: varchar('nrdoc', { length: 25 }).notNull(),
  idgestiune: int('idgestiune', { unsigned: true }).notNull().references(() => gestiuni.id),
  stare: stare(),
  ...timestamps,
}, t => [
  index('operatiuni_gestiune_data_idx').on(t.idgestiune, t.data),
  index('operatiuni_nrdoc_idx').on(t.idgestiune, t.idtipoperatiuni, t.nrdoc),
])

/** Document lines: one debit (entry) or credit (exit) movement each. */
export const tranzactii = mysqlTable('tranzactii', {
  id: int('id').autoincrement().primaryKey(),
  idAntet: int('idAntet').notNull().references(() => operatiuni.id),
  id_categ: int('id_categ', { unsigned: true }).notNull().references(() => categorii.id),
  id_reper: int('id_reper').notNull().references(() => materiale.id),
  id_gestiune: int('id_gestiune', { unsigned: true }).notNull().references(() => gestiuni.id),
  id_locdispunere: int('id_locdispunere').notNull().references(() => locuri.id),
  um: varchar('um', { length: 20 }).notNull(),
  cantitate_debit: decimal('cantitate_debit', { precision: 12, scale: 2 }).notNull().default('0.00'),
  cantitate_credit: decimal('cantitate_credit', { precision: 12, scale: 2 }).notNull().default('0.00'),
  pret: decimal('pret', { precision: 14, scale: 4 }).notNull(),
  debit: decimal('debit', { precision: 14, scale: 4 }).notNull().default('0.0000'),
  credit: decimal('credit', { precision: 14, scale: 4 }).notNull().default('0.0000'),
  stare_material: mysqlEnum('stare_material', STARI_MATERIAL).notNull(),
  tip_material: mysqlEnum('tip_material', TIPURI_MATERIAL).notNull().default('M'),
  stare: stare(),
  ...timestamps,
}, t => [
  index('tranzactii_antet_idx').on(t.idAntet),
  index('tranzactii_stoc_idx').on(t.id_gestiune, t.id_locdispunere, t.id_categ, t.id_reper, t.stare_material),
  index('tranzactii_reper_idx').on(t.id_reper),
])

/** Application settings (single row, id = 1): report header and signatories. */
export const setari = mysqlTable('setari', {
  id: int('id').primaryKey(),
  institutie: varchar('institutie', { length: 255 }).notNull(),
  grad_dir_fin_con: varchar('grad_dir_fin_con', { length: 100 }).notNull().default(''),
  nume_dir_fin_con: varchar('nume_dir_fin_con', { length: 255 }).notNull().default(''),
  grad_comandant: varchar('grad_comandant', { length: 100 }).notNull().default(''),
  nume_comandant: varchar('nume_comandant', { length: 255 }).notNull().default(''),
  ...timestamps,
})

export type Utilizator = typeof utilizatori.$inferSelect
export type Gestiune = typeof gestiuni.$inferSelect
export type Categorie = typeof categorii.$inferSelect
export type Loc = typeof locuri.$inferSelect
export type Material = typeof materiale.$inferSelect
export type Operatiune = typeof operatiuni.$inferSelect
export type Tranzactie = typeof tranzactii.$inferSelect
export type NewTranzactie = typeof tranzactii.$inferInsert
export type Setari = typeof setari.$inferSelect
