# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_09_09_191539) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "chunks", force: :cascade do |t|
    t.integer "amount_pages"
    t.time "amount_time"
    t.date "date_started"
    t.integer "days"
    t.bigint "perusal_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["perusal_id"], name: "index_chunks_on_perusal_id"
  end

  create_table "csv_configs", force: :cascade do |t|
    t.boolean "rating_enabled"
    t.boolean "sources_isbn_enabled"
    t.boolean "dates_started_enabled"
    t.boolean "genres_enabled"
    t.boolean "length_enabled"
    t.boolean "public_notes_enabled"
    t.boolean "blurb_enabled"
    t.boolean "private_notes_enabled"
    t.boolean "history_enabled"
    t.integer "maximum_rating"
    t.text "rating_key"
    t.string "group_read_emoji"
    t.string "date_separator"
    t.string "notes_newline"
    t.text "extra_info_prefixes"
    t.text "extra_info_postfixes"
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_csv_configs_on_user_id"
  end

  create_table "custom_columns", force: :cascade do |t|
    t.string "name"
    t.string "type"
    t.bigint "csv_config_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["csv_config_id"], name: "index_custom_columns_on_csv_config_id"
  end

  create_table "dropbox_accounts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "token"
    t.string "filepath"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_dropbox_accounts_on_user_id"
  end

  create_table "formats", force: :cascade do |t|
    t.string "name"
    t.string "emoji"
    t.bigint "csv_config_id", null: false
    t.bigint "type_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["csv_config_id"], name: "index_formats_on_csv_config_id"
    t.index ["type_id"], name: "index_formats_on_type_id"
  end

  create_table "genres", force: :cascade do |t|
    t.string "name"
    t.bigint "visibility_config_id", null: false
    t.bigint "item_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["item_id"], name: "index_genres_on_item_id"
    t.index ["visibility_config_id"], name: "index_genres_on_visibility_config_id"
  end

  create_table "genres_items", id: false, force: :cascade do |t|
    t.bigint "item_id", null: false
    t.bigint "genre_id", null: false
  end

  create_table "items", force: :cascade do |t|
    t.float "rating"
    t.string "author"
    t.string "title"
    t.string "series"
    t.integer "volume"
    t.text "extra_info"
    t.string "isbn"
    t.integer "length_pages"
    t.time "length_time"
    t.text "blurb"
    t.text "history"
    t.integer "visibility"
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_items_on_user_id"
  end

  create_table "items_sources", id: false, force: :cascade do |t|
    t.bigint "item_id", null: false
    t.bigint "source_id", null: false
  end

  create_table "perusals", force: :cascade do |t|
    t.date "date_added"
    t.integer "progress"
    t.bigint "item_id", null: false
    t.bigint "format_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["format_id"], name: "index_perusals_on_format_id"
    t.index ["item_id"], name: "index_perusals_on_item_id"
  end

  create_table "sources", force: :cascade do |t|
    t.string "name"
    t.string "url"
    t.bigint "item_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["item_id"], name: "index_sources_on_item_id"
  end

  create_table "types", force: :cascade do |t|
    t.string "name"
    t.string "emoji"
    t.bigint "csv_config_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["csv_config_id"], name: "index_types_on_csv_config_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "visibility_configs", force: :cascade do |t|
    t.integer "level"
    t.float "minimum_rating"
    t.boolean "formats_visible"
    t.boolean "group_reads_visible"
    t.boolean "planned_visible"
    t.boolean "public_notes_visible"
    t.boolean "private_notes_visible"
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_visibility_configs_on_user_id"
  end

  add_foreign_key "chunks", "perusals"
  add_foreign_key "csv_configs", "users"
  add_foreign_key "custom_columns", "csv_configs"
  add_foreign_key "dropbox_accounts", "users"
  add_foreign_key "formats", "csv_configs"
  add_foreign_key "formats", "types"
  add_foreign_key "genres", "items"
  add_foreign_key "genres", "visibility_configs"
  add_foreign_key "items", "users"
  add_foreign_key "perusals", "formats"
  add_foreign_key "perusals", "items"
  add_foreign_key "sources", "items"
  add_foreign_key "types", "csv_configs"
  add_foreign_key "visibility_configs", "users"
end
