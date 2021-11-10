class CreateGenres < ActiveRecord::Migration[7.0]
  def change
    create_table :genres do |t|
      t.string :name
      t.references :visibility_config, foreign_key: true

      t.timestamps
    end

    add_index :genres, :name

    create_join_table :items, :genres do |t|
      t.index :item_id
      t.index :genre_id
    end
  end
end
