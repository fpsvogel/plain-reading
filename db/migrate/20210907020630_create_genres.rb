class CreateGenres < ActiveRecord::Migration[6.1]
  def change
    create_table :genres do |t|
      t.string :name
      t.references :visibility_config, foreign_key: true
      # t.references :item, foreign_key: true

      t.timestamps
    end

    add_index :genres, :name

    # TODO why do I need both of these join tables for HABTM? in the Rails
    # Guides there's only one. but when I have only one, there's a DB error
    # either in creating or destroying an item, depending on which is omitted.
    create_table :items_genres, id: false do |t|
      t.belongs_to :item
      t.belongs_to :genre
    end

    create_table :genres_items, id: false do |t|
      t.belongs_to :genre
      t.belongs_to :item
    end
  end
end
