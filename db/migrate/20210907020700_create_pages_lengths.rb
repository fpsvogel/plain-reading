class CreatePagesLengths < ActiveRecord::Migration[6.1]
  def change
    create_table :pages_lengths do |t|
      t.integer :pages
      t.references :variant, null: false, foreign_key: true

      t.timestamps
    end
  end
end
