class CreateColumns < ActiveRecord::Migration
  def change
    create_table :columns do |t|
      t.string :name
      t.string :label
      t.boolean :enabled
      t.references :csv_config, null: false, foreign_key: true

      t.timestamps
    end

    add_index :columns, :name
  end
end
