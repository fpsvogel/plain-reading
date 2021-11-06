class CreateExperiences < ActiveRecord::Migration[6.1]
  def change
    create_table :experiences do |t|
      t.date :date_added
      t.date :date_started
      t.date :date_finished
      t.float :progress
      t.string :group
      t.references :item, null: false, foreign_key: true
      t.references :variant, foreign_key: true

      t.timestamps
    end

    add_index :experiences, :group
  end
end
