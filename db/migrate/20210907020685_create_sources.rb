class CreateSources < ActiveRecord::Migration[6.1]
  def change
    create_table :sources do |t|
      t.string :name
      t.string :url
      # t.references :variant, null: false, foreign_key: true

      t.timestamps
    end

    # TODO why do I need both of these join tables for HABTM? in the Rails
    # Guides there's only one. but when I have only one, there's a DB error
    # either in creating or destroying an item, depending on which is omitted.
    create_table :variants_sources, id: false do |t|
      t.belongs_to :variant
      t.belongs_to :source
    end

    create_table :sources_variants, id: false do |t|
      t.belongs_to :source
      t.belongs_to :variant
    end
  end
end
