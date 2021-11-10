class CreateTypes < ActiveRecord::Migration
  def change
    create_table :types do |t|
      t.string :name
      t.string :emoji
      t.references :csv_config, null: false, foreign_key: true

      t.timestamps
    end

    add_index :types, :name
  end
end
