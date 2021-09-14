class CreateCsvConfigs < ActiveRecord::Migration[6.1]
  def change
    create_table :csv_configs do |t|
      t.boolean :rating_enabled
      t.boolean :sources_isbn_enabled
      t.boolean :dates_started_enabled
      t.boolean :genres_enabled
      t.boolean :length_enabled
      t.boolean :public_notes_enabled
      t.boolean :blurb_enabled
      t.boolean :private_notes_enabled
      t.boolean :history_enabled
      t.integer :maximum_rating
      t.text :rating_key
      t.string :group_read_emoji
      t.string :date_separator
      t.string :notes_newline
      t.text :extra_info_prefixes
      t.text :extra_info_postfixes
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
