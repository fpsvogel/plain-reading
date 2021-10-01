class CreateColumns < ActiveRecord::Migration[6.1]
  def change
    create_table :columns do |t|
      t.string :name
      t.string :label
      t.boolean :enabled
      t.references :csv_config, null: false, foreign_key: true

      t.timestamps
    end
  end
end
