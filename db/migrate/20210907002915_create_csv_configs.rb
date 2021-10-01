class CreateCsvConfigs < ActiveRecord::Migration[6.1]
  def change
    create_table :csv_configs do |t|
      t.integer :maximum_rating
      t.integer :star_for_rating_minimum
      t.text :rating_key
      t.string :default_emoji
      t.string :comment_character
      t.string :dnf_string
      t.boolean :reverse_dates
      t.boolean :skip_compact_planned
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
