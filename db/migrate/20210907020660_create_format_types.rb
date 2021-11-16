class CreateFormatTypes < ActiveRecord::Migration[7.0]
  def change
    create_table :format_types do |t|
      t.string :name
      t.string :emoji
      t.references :csv_config, null: false, foreign_key: true

      t.timestamps
    end

    add_index :format_types, :name
  end
end
