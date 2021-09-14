class CreatePerusals < ActiveRecord::Migration[6.1]
  def change
    create_table :perusals do |t|
      t.date :date_added
      t.integer :progress
      t.references :item, null: false, foreign_key: true
      t.references :format, null: false, foreign_key: true

      t.timestamps
    end
  end
end
