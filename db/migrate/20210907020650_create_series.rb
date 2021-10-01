class CreateSeries < ActiveRecord::Migration[6.1]
  def change
    create_table :series do |t|
      t.string :name
      t.integer :volume
      # t.references :item, null: false, foreign_key: true

      t.timestamps
    end

    # TODO why do I need both of these join tables for HABTM? in the Rails
    # Guides there's only one. but when I have only one, there's a DB error
    # either in creating or destroying an item, depending on which is omitted.
    create_table :items_series, id: false do |t|
      t.belongs_to :item
      t.belongs_to :series
    end

    create_table :series_items, id: false do |t|
      t.belongs_to :series
      t.belongs_to :item
    end
  end
end
