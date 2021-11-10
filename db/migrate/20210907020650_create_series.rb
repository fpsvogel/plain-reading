class CreateSeries < ActiveRecord::Migration[7.0]
  def change
    create_table :series do |t|
      t.string :name
      t.integer :volume
      t.references :item, null: false, foreign_key: true

      t.timestamps
    end

    add_index :series, :name
  end
end
