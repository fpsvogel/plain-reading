class CreateTimeLengths < ActiveRecord::Migration[7.0]
  def change
    create_table :time_lengths do |t|
      t.float :hours
      t.references :variant, null: false, foreign_key: true

      t.timestamps
    end
  end
end
