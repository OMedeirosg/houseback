import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

    await knex.schema.dropTableIfExists("users");

    await knex.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("email").notNullable().unique();
        table.timestamps(true, true); // created_at and updated_at
    })


}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("users");
}

