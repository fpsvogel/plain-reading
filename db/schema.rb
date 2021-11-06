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

ActiveRecord::Schema.define(version: 2021_09_07_020730) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "chunks", force: :cascade do |t|
    t.integer "amount_pages"
    t.time "amount_time"
    t.date "date_started"
    t.integer "days"
    t.bigint "experience_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["experience_id"], name: "index_chunks_on_experience_id"
  end

  create_table "columns", force: :cascade do |t|
    t.string "name"
    t.string "label"
    t.boolean "enabled"
    t.bigint "csv_config_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["csv_config_id"], name: "index_columns_on_csv_config_id"
  end

  create_table "csv_configs", force: :cascade do |t|
    t.integer "maximum_rating"
    t.integer "star_for_rating_minimum"
    t.text "rating_key"
    t.string "default_emoji"
    t.string "comment_character"
    t.string "dnf_string"
    t.boolean "reverse_dates"
    t.boolean "skip_compact_planned"
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

  create_table "experiences", force: :cascade do |t|
    t.date "date_added"
    t.date "date_started"
    t.date "date_finished"
    t.float "progress"
    t.string "group"
    t.bigint "item_id", null: false
    t.bigint "variant_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["item_id"], name: "index_experiences_on_item_id"
    t.index ["variant_id"], name: "index_experiences_on_variant_id"
  end

  create_table "formats", force: :cascade do |t|
    t.string "name"
    t.string "emoji"
    t.bigint "visibility_config_id"
    t.bigint "csv_config_id", null: false
    t.bigint "type_id"
    t.bigint "item_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["csv_config_id"], name: "index_formats_on_csv_config_id"
    t.index ["item_id"], name: "index_formats_on_item_id"
    t.index ["type_id"], name: "index_formats_on_type_id"
    t.index ["visibility_config_id"], name: "index_formats_on_visibility_config_id"
  end

  create_table "genres", force: :cascade do |t|
    t.string "name"
    t.bigint "visibility_config_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["name"], name: "index_genres_on_name", unique: true
    t.index ["visibility_config_id"], name: "index_genres_on_visibility_config_id"
  end

  create_table "genres_items", id: false, force: :cascade do |t|
    t.bigint "genre_id"
    t.bigint "item_id"
    t.index ["genre_id"], name: "index_genres_items_on_genre_id"
    t.index ["item_id"], name: "index_genres_items_on_item_id"
  end

  create_table "items", force: :cascade do |t|
    t.float "rating"
    t.string "author"
    t.string "title"
    t.integer "visibility"
    t.text "public_notes"
    t.text "blurb"
    t.text "private_notes"
    t.text "history"
    t.string "view_rating"
    t.string "view_type"
    t.string "view_url"
    t.string "view_name"
    t.string "view_date_finished"
    t.boolean "planned"
    t.string "group_experiences"
    t.bigint "list_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["list_id"], name: "index_items_on_list_id"
  end

  create_table "items_genres", id: false, force: :cascade do |t|
    t.bigint "item_id"
    t.bigint "genre_id"
    t.index ["genre_id"], name: "index_items_genres_on_genre_id"
    t.index ["item_id"], name: "index_items_genres_on_item_id"
  end

  create_table "items_series", id: false, force: :cascade do |t|
    t.bigint "item_id"
    t.bigint "series_id"
    t.index ["item_id"], name: "index_items_series_on_item_id"
    t.index ["series_id"], name: "index_items_series_on_series_id"
  end

  create_table "lists", force: :cascade do |t|
    t.text "load_errors"
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_lists_on_user_id"
  end

  create_table "pages_lengths", force: :cascade do |t|
    t.integer "pages"
    t.bigint "variant_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["variant_id"], name: "index_pages_lengths_on_variant_id"
  end

  create_table "series", force: :cascade do |t|
    t.string "name"
    t.integer "volume"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "series_items", id: false, force: :cascade do |t|
    t.bigint "series_id"
    t.bigint "item_id"
    t.index ["item_id"], name: "index_series_items_on_item_id"
    t.index ["series_id"], name: "index_series_items_on_series_id"
  end

  create_table "sources", force: :cascade do |t|
    t.string "name"
    t.string "url"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "sources_variants", id: false, force: :cascade do |t|
    t.bigint "source_id"
    t.bigint "variant_id"
    t.index ["source_id"], name: "index_sources_variants_on_source_id"
    t.index ["variant_id"], name: "index_sources_variants_on_variant_id"
  end

  create_table "time_lengths", force: :cascade do |t|
    t.float "hours"
    t.bigint "variant_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["variant_id"], name: "index_time_lengths_on_variant_id"
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
    t.string "username", null: false
    t.string "email", null: false
    t.string "crypted_password"
    t.string "salt"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "variants", force: :cascade do |t|
    t.string "isbn"
    t.text "extra_info"
    t.boolean "view"
    t.string "length_type"
    t.bigint "length_id"
    t.bigint "item_id", null: false
    t.bigint "format_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["format_id"], name: "index_variants_on_format_id"
    t.index ["item_id"], name: "index_variants_on_item_id"
    t.index ["length_type", "length_id"], name: "index_variants_on_length"
  end

  create_table "variants_sources", id: false, force: :cascade do |t|
    t.bigint "variant_id"
    t.bigint "source_id"
    t.index ["source_id"], name: "index_variants_sources_on_source_id"
    t.index ["variant_id"], name: "index_variants_sources_on_variant_id"
  end

  create_table "visibility_configs", force: :cascade do |t|
    t.integer "level"
    t.float "minimum_rating"
    t.text "hidden_genres"
    t.boolean "formats_visible"
    t.boolean "group_experiences_visible"
    t.boolean "planned_visible"
    t.boolean "public_notes_visible"
    t.boolean "private_notes_visible"
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_visibility_configs_on_user_id"
  end

  add_foreign_key "chunks", "experiences"
  add_foreign_key "columns", "csv_configs"
  add_foreign_key "csv_configs", "users"
  add_foreign_key "custom_columns", "csv_configs"
  add_foreign_key "dropbox_accounts", "users"
  add_foreign_key "experiences", "items"
  add_foreign_key "experiences", "variants"
  add_foreign_key "formats", "csv_configs"
  add_foreign_key "formats", "items"
  add_foreign_key "formats", "types"
  add_foreign_key "formats", "visibility_configs"
  add_foreign_key "genres", "visibility_configs"
  add_foreign_key "items", "lists"
  add_foreign_key "lists", "users"
  add_foreign_key "pages_lengths", "variants"
  add_foreign_key "time_lengths", "variants"
  add_foreign_key "types", "csv_configs"
  add_foreign_key "variants", "formats"
  add_foreign_key "variants", "items"
  add_foreign_key "visibility_configs", "users"
end
