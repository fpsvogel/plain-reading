class CreateChunks < ActiveRecord::Migration[6.1]
  def change
    create_table :chunks do |t|
      t.integer :amount_pages
      t.time :amount_time
      t.date :date_started
      t.integer :days
      t.references :perusal, null: false, foreign_key: true

      t.timestamps
    end
  end
end
